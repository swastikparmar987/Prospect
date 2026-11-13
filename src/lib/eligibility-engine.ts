import { Opportunity, UserProfile, EligibilityCheck, SeniorityLevel } from "@/types";

export interface SeniorityClassification {
  level: SeniorityLevel;
  reasons: string[];
  isLeadershipOrSenior: boolean;
  minYearsExperience: number;
}

/**
 * Multi-factor seniority classifier.
 * Evaluates titles, required years of experience, and leadership responsibilities.
 */
export function classifyOpportunitySeniority(
  opportunity: Partial<Opportunity>
): SeniorityClassification {
  const title = (opportunity.title || "").toLowerCase();
  const desc = (opportunity.description || "").toLowerCase();
  const elReqs = (opportunity.eligibilityRequirements || []).map((r) => r.toLowerCase()).join(" ");
  const reqSkills = (opportunity.requiredSkills || []).map((s) => s.toLowerCase()).join(" ");
  const combinedText = `${title} ${desc} ${elReqs} ${reqSkills}`;

  const reasons: string[] = [];

  // Extract years of experience mentions
  const yearsMatches = [
    ...combinedText.matchAll(/\b([0-9]{1,2})\+?\s*(?:to|-)?\s*([0-9]{1,2})?\s*years?(?:\s+of)?(?:\s+experience|\s+industry)?\b/gi),
  ];
  let maxYears = 0;
  for (const match of yearsMatches) {
    const y1 = parseInt(match[1], 10);
    const y2 = match[2] ? parseInt(match[2], 10) : y1;
    const y = Math.max(y1, y2);
    if (y > maxYears && y < 30) {
      maxYears = y;
    }
  }

  // 1. Internship / Student roles
  const isTitleIntern = /\b(intern|internship|co-op|coop|summer associate|student researcher|fellow|fellowship|apprentice)\b/i.test(title);
  if (isTitleIntern) {
    reasons.push("Title explicitly designates internship or student fellowship");
    return {
      level: "INTERN",
      reasons,
      isLeadershipOrSenior: false,
      minYearsExperience: maxYears || 0,
    };
  }

  // 2. New Grad / University Graduate
  const isTitleNewGrad = /\b(new grad|new graduate|recent grad|university grad|campus hire)\b/i.test(title);
  if (isTitleNewGrad) {
    reasons.push("Title explicitly designates new graduate position");
    return {
      level: "NEW_GRAD",
      reasons,
      isLeadershipOrSenior: false,
      minYearsExperience: maxYears || 0,
    };
  }

  // 3. Director / VP / Executive
  const isDirector = /\b(director|vp|vice president|head of|chief|cto|cio|cso)\b/i.test(title);
  if (isDirector) {
    reasons.push("Title contains executive or director leadership keyword");
    return {
      level: "DIRECTOR",
      reasons,
      isLeadershipOrSenior: true,
      minYearsExperience: Math.max(maxYears, 7),
    };
  }

  // 4. Manager / Engineering Manager / Lead
  const isManagerTitle = /\b(engineering manager|eng manager|technical manager|manager|team lead|people manager)\b/i.test(title);
  const hasManagementResponsibilities =
    /\b(manage a team|manage an engineering team|budget ownership|people management|direct reports|hiring and performance reviews|leading a team of \d+)\b/i.test(combinedText);

  if (isManagerTitle || (hasManagementResponsibilities && !isTitleIntern)) {
    reasons.push(
      isManagerTitle
        ? "Title explicitly designates managerial role"
        : "Role requires direct people management and organizational leadership"
    );
    return {
      level: "MANAGER",
      reasons,
      isLeadershipOrSenior: true,
      minYearsExperience: Math.max(maxYears, 5),
    };
  }

  // 5. Principal / Architect
  const isPrincipal = /\b(principal|distinguished|chief architect|enterprise architect)\b/i.test(title);
  if (isPrincipal) {
    reasons.push("Title designates principal or executive architectural role");
    return {
      level: "PRINCIPAL",
      reasons,
      isLeadershipOrSenior: true,
      minYearsExperience: Math.max(maxYears, 8),
    };
  }

  // 6. Staff Engineer
  const isStaff = /\bstaff\b/i.test(title) || /\btech lead\b/i.test(title);
  if (isStaff) {
    reasons.push("Title designates staff level technical leadership");
    return {
      level: "STAFF",
      reasons,
      isLeadershipOrSenior: true,
      minYearsExperience: Math.max(maxYears, 6),
    };
  }

  // 7. Senior Engineer
  const isSeniorTitle = /\b(senior|sr\.?|lead engineer|lead software|lead developer)\b/i.test(title);
  if (isSeniorTitle || maxYears >= 5) {
    reasons.push(
      isSeniorTitle
        ? "Title designates senior level engineer"
        : `Requires ${maxYears}+ years of full-time experience`
    );
    return {
      level: "SENIOR",
      reasons,
      isLeadershipOrSenior: true,
      minYearsExperience: Math.max(maxYears, 4),
    };
  }

  // 8. Mid-level Engineer
  const isMidLevel = /\b(mid[\s-]level|software engineer ii|swe ii|engineer ii|level 2|l2)\b/i.test(title) || maxYears >= 3;
  if (isMidLevel) {
    reasons.push(maxYears >= 3 ? `Requires ${maxYears}+ years of experience` : "Title designates mid-level engineer");
    return {
      level: "MID_LEVEL",
      reasons,
      isLeadershipOrSenior: false,
      minYearsExperience: maxYears || 3,
    };
  }

  // 9. Early Career / Associate / Junior
  const isEarlyCareer = /\b(entry[\s-]level|associate|junior|jr\.?|level 1|l1|graduate)\b/i.test(title) || maxYears <= 2;
  if (isEarlyCareer) {
    reasons.push("Designates entry-level or associate role");
    return {
      level: "EARLY_CAREER",
      reasons,
      isLeadershipOrSenior: false,
      minYearsExperience: maxYears || 0,
    };
  }

  return {
    level: "UNKNOWN",
    reasons: ["Role title and description do not explicitly state seniority requirements"],
    isLeadershipOrSenior: false,
    minYearsExperience: maxYears || 0,
  };
}

/**
 * Deterministic, rule-based Eligibility Engine.
 * Evaluates candidate requirements against user profile facts.
 * Strictly separates HARD BLOCKERS from soft skill preferences.
 * Unknown profile facts yield UNKNOWN, never an invented pass or fail.
 */
export function evaluateEligibility(
  opportunity: Opportunity,
  profile: UserProfile | null
): {
  checks: EligibilityCheck[];
  hardBlockers: string[];
  allHardBlockersMet: boolean;
  hasUnknowns: boolean;
  classifiedSeniority: SeniorityClassification;
} {
  const checks: EligibilityCheck[] = [];
  const hardBlockers: string[] = [];
  const seniority = classifyOpportunitySeniority(opportunity);

  if (!profile) {
    // If no profile is set, all stated requirements are UNKNOWN
    for (const req of opportunity.eligibilityRequirements) {
      checks.push({
        rule: req,
        status: "UNKNOWN",
        reason: "No user profile is currently configured to compare against.",
        evidence: "Opportunity requirement: " + req,
        isHardBlocker: isRequirementHardBlocker(req),
      });
    }
    return {
      checks,
      hardBlockers: [],
      allHardBlockersMet: false,
      hasUnknowns: true,
      classifiedSeniority: seniority,
    };
  }

  // 1. Evaluate explicit opportunity eligibility requirements
  for (const rawReq of opportunity.eligibilityRequirements) {
    const reqLower = rawReq.toLowerCase();
    const isHard = isRequirementHardBlocker(rawReq);

    // Case A: Graduation year / Student status
    if (
      reqLower.includes("graduation") ||
      reqLower.includes("graduating") ||
      reqLower.includes("class of") ||
      reqLower.includes("senior") ||
      reqLower.includes("junior") ||
      reqLower.includes("currently enrolled") ||
      reqLower.includes("undergraduate") ||
      reqLower.includes("masters") ||
      reqLower.includes("phd")
    ) {
      const gradYearMatch = rawReq.match(/20\d\d/g);
      if (gradYearMatch && profile.graduationYear) {
        const requiredYears = gradYearMatch.map((y) => parseInt(y, 10));
        const userYear = profile.graduationYear;

        if (requiredYears.includes(userYear)) {
          checks.push({
            rule: rawReq,
            status: "MET",
            reason: `Your graduation year (${userYear}) matches the required graduation window (${requiredYears.join(", ")}).`,
            evidence: `Profile graduation year: ${userYear}`,
            isHardBlocker: isHard,
          });
        } else if (
          // Check range like "graduating between 2025 and 2026"
          reqLower.includes("between") &&
          requiredYears.length >= 2 &&
          userYear >= Math.min(...requiredYears) &&
          userYear <= Math.max(...requiredYears)
        ) {
          checks.push({
            rule: rawReq,
            status: "MET",
            reason: `Your graduation year (${userYear}) falls within the required range (${Math.min(...requiredYears)}–${Math.max(...requiredYears)}).`,
            evidence: `Profile graduation year: ${userYear}`,
            isHardBlocker: isHard,
          });
        } else {
          checks.push({
            rule: rawReq,
            status: "NOT MET",
            reason: `Your graduation year (${userYear}) does not match the opportunity's requirement (${requiredYears.join(", ")}).`,
            evidence: `Profile graduation year: ${userYear}`,
            isHardBlocker: isHard,
          });
          if (isHard) {
            hardBlockers.push(`Graduation year mismatch: requires ${requiredYears.join(", ")}, you have ${userYear}`);
          }
        }
      } else if (!profile.graduationYear) {
        checks.push({
          rule: rawReq,
          status: "UNKNOWN",
          reason: "Your profile does not specify a graduation year.",
          evidence: "Missing profile graduationYear",
          isHardBlocker: isHard,
        });
      } else {
        // Degree level match
        const degreeLower = (profile.degree || "").toLowerCase();
        if (
          (reqLower.includes("phd required") || reqLower.includes("completed phd")) &&
          degreeLower &&
          !degreeLower.includes("phd") &&
          !degreeLower.includes("ph.d") &&
          !degreeLower.includes("doctor")
        ) {
          checks.push({
            rule: rawReq,
            status: "NOT MET",
            reason: `Requires a PhD, whereas your profile lists ${profile.degree}.`,
            evidence: `Profile degree: ${profile.degree}`,
            isHardBlocker: true,
          });
          hardBlockers.push(`Degree level mismatch: PhD required (profile has ${profile.degree})`);
        } else if (reqLower.includes("undergraduate") || reqLower.includes("bachelor")) {
          const isUg = degreeLower.includes("bachelor") || degreeLower.includes("b.s") || degreeLower.includes("b.e") || degreeLower.includes("b.tech");
          checks.push({
            rule: rawReq,
            status: isUg ? "MET" : "UNKNOWN",
            reason: isUg ? `Degree (${profile.degree}) indicates undergraduate enrollment.` : `Degree (${profile.degree}) could not be confirmed as undergraduate.`,
            evidence: `Profile degree: ${profile.degree || "unspecified"}`,
            isHardBlocker: isHard,
          });
        } else {
          checks.push({
            rule: rawReq,
            status: "UNKNOWN",
            reason: "Could not deterministically verify graduation requirement against current profile.",
            evidence: `Profile: ${profile.degree} (Class of ${profile.graduationYear || "?"})`,
            isHardBlocker: isHard,
          });
        }
      }
      continue;
    }

    // Case A2: Senior / Multi-year Full-Time Experience Hard Blocker (e.g., "Minimum 5+ years of full-time industry experience")
    const yearsExpMatch = rawReq.match(/\b([4-9]|\d{2,})\+?\s*years?\b/i);
    if (
      yearsExpMatch &&
      (reqLower.includes("experience") || reqLower.includes("industry"))
    ) {
      const reqYears = parseInt(yearsExpMatch[1], 10);
      const isStudentOrEarlyCareer =
        (profile.graduationYear && profile.graduationYear >= new Date().getFullYear()) ||
        (profile.experiences || []).length < 3;
      if (reqYears >= 4 && isStudentOrEarlyCareer) {
        checks.push({
          rule: rawReq,
          status: "NOT MET",
          reason: `Requires ${reqYears}+ years of full-time experience; candidate profile is early-career / student level.`,
          evidence: `Profile experience entries: ${(profile.experiences || []).length}`,
          isHardBlocker: true,
        });
        hardBlockers.push(`Seniority mismatch: requires ${reqYears}+ years of experience`);
        continue;
      }
    }

    // Case B: Minimum GPA requirement
    const gpaMatch = rawReq.match(/\b([234]\.\d{1,2})\b/);
    if (gpaMatch && (reqLower.includes("gpa") || reqLower.includes("grade point"))) {
      const requiredGpa = parseFloat(gpaMatch[1]);
      if (profile.gpa !== undefined && profile.gpa !== null) {
        if (profile.gpa >= requiredGpa) {
          checks.push({
            rule: rawReq,
            status: "MET",
            reason: `Your GPA (${profile.gpa.toFixed(2)}) meets or exceeds the minimum required GPA (${requiredGpa.toFixed(2)}).`,
            evidence: `Profile GPA: ${profile.gpa.toFixed(2)}`,
            isHardBlocker: isHard,
          });
        } else {
          checks.push({
            rule: rawReq,
            status: "NOT MET",
            reason: `Your GPA (${profile.gpa.toFixed(2)}) is below the stated minimum (${requiredGpa.toFixed(2)}).`,
            evidence: `Profile GPA: ${profile.gpa.toFixed(2)}`,
            isHardBlocker: isHard,
          });
          if (isHard) {
            hardBlockers.push(`GPA requirement not met: requires ${requiredGpa.toFixed(2)}+, you have ${profile.gpa.toFixed(2)}`);
          }
        }
      } else {
        checks.push({
          rule: rawReq,
          status: "UNKNOWN",
          reason: "Your profile does not list a cumulative GPA.",
          evidence: "Missing profile GPA",
          isHardBlocker: isHard,
        });
      }
      continue;
    }

    // Case C: Major / Field of Study
    if (reqLower.includes("major") || reqLower.includes("degree in") || reqLower.includes("computer science") || reqLower.includes("engineering")) {
      const userMajorLower = (profile.major || "").toLowerCase();
      if (!userMajorLower) {
        checks.push({
          rule: rawReq,
          status: "UNKNOWN",
          reason: "Your profile does not specify a major or field of study.",
          evidence: "Missing profile major",
          isHardBlocker: isHard,
        });
      } else {
        const csKeywords = ["computer science", "software engineering", "computer engineering", "data science", "information technology"];
        const matchesField = csKeywords.some((k) => reqLower.includes(k) && userMajorLower.includes(k.replace("engineering", "")));
        if (matchesField || reqLower.includes(userMajorLower)) {
          checks.push({
            rule: rawReq,
            status: "MET",
            reason: `Your field of study (${profile.major}) matches the requirement.`,
            evidence: `Profile major: ${profile.major}`,
            isHardBlocker: isHard,
          });
        } else if (reqLower.includes("related field") || reqLower.includes("or equivalent")) {
          checks.push({
            rule: rawReq,
            status: "UNKNOWN",
            reason: `Opportunity accepts related fields; please verify whether (${profile.major}) qualifies.`,
            evidence: `Profile major: ${profile.major}`,
            isHardBlocker: isHard,
          });
        } else {
          checks.push({
            rule: rawReq,
            status: "UNKNOWN",
            reason: `Requires specific major; verify if (${profile.major}) satisfies this condition.`,
            evidence: `Profile major: ${profile.major}`,
            isHardBlocker: isHard,
          });
        }
      }
      continue;
    }

    // Case D: Location / Authorization constraints
    if (
      reqLower.includes("authorized to work") ||
      reqLower.includes("sponsorship") ||
      reqLower.includes("us citizen") ||
      reqLower.includes("eu citizen") ||
      reqLower.includes("security clearance")
    ) {
      if (profile.constraints) {
        const constLower = profile.constraints.toLowerCase();
        const hasNoSponsorship = 
          constLower.includes("no sponsorship") || 
          constLower.includes("not require sponsorship") ||
          constLower.includes("no visa") ||
          constLower.includes("without sponsorship");

        const requiresSponsorship = !hasNoSponsorship && (
          constLower.includes("requires sponsorship") ||
          constLower.includes("require sponsorship") ||
          constLower.includes("requires visa sponsorship") ||
          constLower.includes("require visa sponsorship") ||
          constLower.includes("need sponsorship") ||
          constLower.includes("needs sponsorship") ||
          constLower.includes("requires h1b") ||
          constLower.includes("visa sponsorship required") ||
          constLower.includes("f-1") ||
          constLower.includes("cpt") ||
          constLower.includes("opt") ||
          (constLower.includes("international") && !hasNoSponsorship)
        );

        const employerNoSponsorship =
          reqLower.includes("no sponsorship") ||
          reqLower.includes("no visa sponsorship") ||
          reqLower.includes("sponsorship not") ||
          reqLower.includes("without sponsorship") ||
          reqLower.includes("not provide sponsorship");

        if (employerNoSponsorship && requiresSponsorship) {
          checks.push({
            rule: rawReq,
            status: "NOT MET",
            reason: "Employer does not provide visa sponsorship; your profile indicates sponsorship is required.",
            evidence: `Profile constraint: ${profile.constraints}`,
            isHardBlocker: true,
          });
          hardBlockers.push("Visa sponsorship not offered by employer");
        } else if (employerNoSponsorship && hasNoSponsorship) {
          checks.push({
            rule: rawReq,
            status: "MET",
            reason: "You are legally authorized to work without employer visa sponsorship.",
            evidence: `Profile constraint: ${profile.constraints}`,
            isHardBlocker: false,
          });
        } else if (reqLower.includes("us citizen") && (constLower.includes("international") || requiresSponsorship)) {
          checks.push({
            rule: rawReq,
            status: "NOT MET",
            reason: "Requires citizenship; profile notes international student status.",
            evidence: `Profile constraint: ${profile.constraints}`,
            isHardBlocker: true,
          });
          hardBlockers.push("US Citizenship required by federal/employer policy");
        } else if (
          (reqLower.includes("cpt") || reqLower.includes("opt")) &&
          (constLower.includes("cpt") || constLower.includes("opt"))
        ) {
          checks.push({
            rule: rawReq,
            status: "MET",
            reason: "Employer accommodates CPT/OPT work authorization matching your student profile.",
            evidence: `Profile constraint: ${profile.constraints}`,
            isHardBlocker: false,
          });
        } else {
          checks.push({
            rule: rawReq,
            status: "UNKNOWN",
            reason: "Work authorization requirements must be manually verified for your specific visa status.",
            evidence: `Profile constraints: ${profile.constraints || "none noted"}`,
            isHardBlocker: isHard,
          });
        }
      } else {
        checks.push({
          rule: rawReq,
          status: "UNKNOWN",
          reason: "Profile contains no explicit work authorization or citizenship notes.",
          evidence: "Missing profile work authorization status",
          isHardBlocker: isHard,
        });
      }
      continue;
    }

    // Default Fallback for unstructured rules: mark as UNKNOWN for human verification
    checks.push({
      rule: rawReq,
      status: "UNKNOWN",
      reason: "Requires manual check against your specific coursework or qualifications.",
      evidence: "Unstructured listing requirement",
      isHardBlocker: isHard,
    });
  }

  // 2. Work Mode / Location compatibility check
  if (opportunity.workMode === "On-site" && profile.location) {
    const oppLocLower = opportunity.location.toLowerCase();
    const userLocLower = profile.location.toLowerCase();
    const cityMatches = oppLocLower.includes(userLocLower) || userLocLower.includes(oppLocLower);
    const willingToRelocate = profile.preferredWorkModes.includes("On-site") || profile.preferredWorkModes.includes("Flexible");

    if (!cityMatches && !willingToRelocate) {
      checks.push({
        rule: `Location requirement: On-site in ${opportunity.location}`,
        status: "NOT MET",
        reason: `Role is On-site in ${opportunity.location}, but your profile is based in ${profile.location} and preferred work mode does not include On-site/Relocation.`,
        evidence: `Profile location: ${profile.location}`,
        isHardBlocker: true,
      });
      hardBlockers.push(`On-site location mismatch (${opportunity.location} vs your location ${profile.location})`);
    } else if (cityMatches) {
      checks.push({
        rule: `Location compatibility: ${opportunity.location}`,
        status: "MET",
        reason: `Your location (${profile.location}) aligns with role location.`,
        evidence: `Profile location: ${profile.location}`,
        isHardBlocker: false,
      });
    }
  }

  // 3. User-specified hidden employers & excluded role families
  const hiddenEmployersList: string[] = Array.isArray(profile.hiddenEmployers)
    ? profile.hiddenEmployers
    : typeof profile.hiddenEmployers === "string"
      ? JSON.parse(profile.hiddenEmployers || "[]")
      : [];
  if (
    hiddenEmployersList.some(
      (emp) =>
        emp.trim().toLowerCase() === opportunity.organization.trim().toLowerCase()
    )
  ) {
    checks.push({
      rule: `User filter: Employer ${opportunity.organization}`,
      status: "NOT MET",
      reason: `You explicitly hid postings from ${opportunity.organization}.`,
      evidence: `Hidden employers list includes ${opportunity.organization}`,
      isHardBlocker: true,
    });
    hardBlockers.push(`Hidden employer: ${opportunity.organization}`);
  }

  // 4. Seniority & Leadership Hard Blocker for Students / Early-Career Profiles
  const isCandidateStudentOrEarlyCareer =
    !profile.experienceLevel ||
    profile.experienceLevel.toLowerCase().includes("intern") ||
    profile.experienceLevel.toLowerCase().includes("early") ||
    Boolean(profile.graduationYear && profile.graduationYear >= new Date().getFullYear()) ||
    (profile.experiences || []).length <= 2;

  if (isCandidateStudentOrEarlyCareer && seniority.isLeadershipOrSenior) {
    checks.push({
      rule: `Seniority Level: ${seniority.level}`,
      status: "NOT MET",
      reason: `Role requires ${seniority.level} experience (${seniority.reasons.join("; ")}). Incompatible with student / early-career candidate.`,
      evidence: `Classified as ${seniority.level} (${seniority.minYearsExperience}+ years required). Candidate has ${(profile.experiences || []).length} past experience(s).`,
      isHardBlocker: true,
    });
    hardBlockers.push(`Seniority Mismatch: Role requires management or senior experience (${seniority.level})`);
  }

  return {
    checks,
    hardBlockers,
    allHardBlockersMet: hardBlockers.length === 0,
    hasUnknowns: checks.some((c) => c.status === "UNKNOWN"),
    classifiedSeniority: seniority,
  };
}

/**
 * Identifies if a requirement text represents a non-negotiable hard blocker.
 */
export function isRequirementHardBlocker(requirementText: string): boolean {
  const text = requirementText.toLowerCase();
  const hardPatterns = [
    "must be",
    "required to be",
    "citizen",
    "sponsorship not",
    "no visa sponsorship",
    "currently enrolled in",
    "graduation date between",
    "graduation between",
    "graduating between",
    "class of",
    "minimum gpa",
    "clearance",
    "bachelor's required",
    "phd required",
    "completed phd",
    "5+ years",
  ];
  return hardPatterns.some((pattern) => text.includes(pattern));
}
