import fs from "fs";
import path from "path";
import { computeAtsReport } from "./src/utils/atsScorer.js";

console.log("[JS verify-ats] Starting JS ATS verification...");

try {
  // Read resumes.json
  const resumesPath = path.resolve("../resumes.json");
  const resumes = JSON.parse(fs.readFileSync(resumesPath, "utf-8"));
  console.log(`Loaded ${resumes.length} resumes from resumes.json`);

  const results = [];
  for (const resume of resumes) {
    console.log(`Running JS ATS analysis for: ${resume.title}`);
    const report = computeAtsReport(resume);
    results.push(report);
  }

  // Save JS results
  const jsResultsPath = path.resolve("../js_results.json");
  fs.writeFileSync(jsResultsPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`JS results saved to ${jsResultsPath}`);

  // Now perform the comparison if java_results.json exists
  const javaResultsPath = path.resolve("../java_results.json");
  if (fs.existsSync(javaResultsPath)) {
    console.log("\n--- Starting Engine Comparison ---");
    const javaResults = JSON.parse(fs.readFileSync(javaResultsPath, "utf-8"));

    let overallSuccess = true;

    for (let i = 0; i < resumes.length; i++) {
      const title = resumes[i].title;
      const js = results[i];
      const java = javaResults[i];

      console.log(`\nComparing persona [${i + 1}/${resumes.length}]: ${title}`);

      // 1. Check overall scores
      if (js.atsScore !== java.atsScore) {
        console.error(`❌ Score mismatch! JS: ${js.atsScore}, Java: ${java.atsScore}`);
        overallSuccess = false;
      } else {
        console.log(`✅ Score matches: ${js.atsScore}`);
      }

      // 2. Check detected category
      if (js.category !== java.category) {
        console.error(`❌ Category mismatch! JS: "${js.category}", Java: "${java.category}"`);
        overallSuccess = false;
      } else {
        console.log(`✅ Category matches: "${js.category}"`);
      }

      // 3. Check overall feedback
      if (js.overallFeedback !== java.overallFeedback) {
        console.error(`❌ Feedback mismatch!\n  JS: "${js.overallFeedback}"\n  Java: "${java.overallFeedback}"`);
        overallSuccess = false;
      } else {
        console.log(`✅ Feedback matches.`);
      }

      // 4. Check issues list length
      if (js.issues.length !== java.issues.length) {
        console.error(`❌ Issue count mismatch! JS: ${js.issues.length}, Java: ${java.issues.length}`);
        overallSuccess = false;
      } else {
        console.log(`✅ Issue count matches: ${js.issues.length}`);
      }

      // 5. Compare issue details
      const maxLen = Math.max(js.issues.length, java.issues.length);
      for (let j = 0; j < maxLen; j++) {
        const jsIssue = js.issues[j];
        const javaIssue = java.issues[j];

        if (!jsIssue) {
          console.error(`❌ Java has extra issue at index ${j}: [${javaIssue.type}] in [${javaIssue.section}]`);
          overallSuccess = false;
          continue;
        }
        if (!javaIssue) {
          console.error(`❌ JS has extra issue at index ${j}: [${jsIssue.type}] in [${jsIssue.section}]`);
          overallSuccess = false;
          continue;
        }

        let issueMatches = true;
        if (jsIssue.type !== javaIssue.type) {
          console.error(`  ❌ Index ${j} Type mismatch! JS: "${jsIssue.type}", Java: "${javaIssue.type}"`);
          issueMatches = false;
        }
        if (jsIssue.section !== javaIssue.section) {
          console.error(`  ❌ Index ${j} Section mismatch! JS: "${jsIssue.section}", Java: "${javaIssue.section}"`);
          issueMatches = false;
        }
        if (jsIssue.severity !== javaIssue.severity) {
          console.error(`  ❌ Index ${j} Severity mismatch! JS: "${jsIssue.severity}", Java: "${javaIssue.severity}"`);
          issueMatches = false;
        }
        if (jsIssue.points !== javaIssue.points) {
          console.error(`  ❌ Index ${j} Points mismatch! JS: ${jsIssue.points}, Java: ${javaIssue.points}`);
          issueMatches = false;
        }
        if (jsIssue.suggestion !== javaIssue.suggestion) {
          console.error(`  ❌ Index ${j} Suggestion mismatch!\n    JS: "${jsIssue.suggestion}"\n    Java: "${javaIssue.suggestion}"`);
          issueMatches = false;
        }

        if (issueMatches) {
          // console.log(`  ✅ Index ${j} Matches: [${jsIssue.type}] in [${jsIssue.section}]`);
        } else {
          overallSuccess = false;
        }
      }
    }

    if (overallSuccess) {
      console.log("\n🏆 SUCCESS: Frontend JS and Backend Java ATS results are mathematically identical!");
    } else {
      console.error("\n💥 FAILURE: Inconsistencies found between Frontend and Backend scoring engines.");
      process.exit(1);
    }
  } else {
    console.log("No java_results.json found yet. Run the Java verifier first.");
  }
} catch (error) {
  console.error("Verification script error:", error);
  process.exit(1);
}
