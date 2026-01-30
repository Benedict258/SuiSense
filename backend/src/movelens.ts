const MOVE_FN_REGEX = /0x[0-9a-fA-F]+::[A-Za-z0-9_]+::[A-Za-z0-9_]+/g;
const MODULE_REGEX = /0x[0-9a-fA-F]+::[A-Za-z0-9_]+/g;
const ABORT_CODE_REGEX = /abort\s*code\s*[:=]\s*(0x[0-9a-fA-F]+|\d+)/i;

function detectCategory(text: string): string {
  const lowered = text.toLowerCase();
  if (lowered.includes("moveabort") || lowered.includes("move abort") || lowered.includes("abort code")) {
    return "move_abort";
  }
  if (lowered.includes("insufficient gas") || lowered.includes("gas budget")) {
    return "gas";
  }
  if (lowered.includes("object not found") || lowered.includes("objectnotfound")) {
    return "object_not_found";
  }
  if (lowered.includes("type mismatch") || lowered.includes("type error")) {
    return "type_mismatch";
  }
  if (lowered.includes("ability") && lowered.includes("constraint")) {
    return "ability_constraint";
  }
  if (lowered.includes("borrow") && lowered.includes("error")) {
    return "borrow_error";
  }
  if (lowered.includes("index out of bounds") || (lowered.includes("vector") && lowered.includes("out of bounds"))) {
    return "index_out_of_bounds";
  }
  if (lowered.includes("permission") || lowered.includes("permission denied")) {
    return "permission_error";
  }
  return "unknown";
}

function causeAndFixes(category: string): { cause: string; fixes: string[] } {
  if (category === "move_abort") {
    return {
      cause: "A Move abort was triggered by the called function.",
      fixes: [
        "Locate the aborting module and function and review its abort conditions.",
        "Check inputs and object state used by the function.",
        "Map the abort code to the module's documented error codes, if available."
      ]
    };
  }
  if (category === "gas") {
    return {
      cause: "Gas budget was too low to finish execution.",
      fixes: ["Increase the gas budget for the transaction.", "Reduce computation by simplifying inputs or calls."]
    };
  }
  if (category === "object_not_found") {
    return {
      cause: "An input object could not be found or is not accessible.",
      fixes: [
        "Verify the object ID exists on the selected network.",
        "Ensure the object is not deleted or locked by another transaction.",
        "Confirm the sender has access or ownership if required."
      ]
    };
  }
  if (category === "type_mismatch") {
    return {
      cause: "The provided type arguments or object types do not match the function signature.",
      fixes: ["Re-check the Move function signature and type parameters.", "Ensure the object types passed match expected types."]
    };
  }
  if (category === "ability_constraint") {
    return {
      cause: "A Move ability constraint was violated (key/store/drop/copy).",
      fixes: ["Inspect the type abilities required by the function.", "Adjust the type used or modify the function to accept the type."]
    };
  }
  if (category === "borrow_error") {
    return {
      cause: "A mutable/immutable borrow rule was violated during execution.",
      fixes: ["Review the Move code for conflicting borrows.", "Ensure mutable and immutable borrows are not active at the same time."]
    };
  }
  if (category === "index_out_of_bounds") {
    return {
      cause: "A vector index access was out of bounds.",
      fixes: ["Check vector lengths before indexing.", "Add bounds checks or guard clauses."]
    };
  }
  if (category === "permission_error") {
    return {
      cause: "The transaction lacks permission for the attempted action.",
      fixes: ["Verify ownership or capability requirements in the Move module.", "Ensure the sender has the necessary permissions."]
    };
  }
  return {
    cause: "Unknown error cause (insufficient details).",
    fixes: ["Include the full error output with stack trace.", "Double-check network, inputs, and function arguments."]
  };
}

export function parseMoveError(rawError: string): Record<string, any> {
  const category = detectCategory(rawError);
  const { cause, fixes } = causeAndFixes(category);

  const abortCodeMatch = rawError.match(ABORT_CODE_REGEX);
  const abortCode = abortCodeMatch ? abortCodeMatch[1] : null;

  const stack = Array.from(new Set(rawError.match(MOVE_FN_REGEX) || []));
  const modules = Array.from(new Set(rawError.match(MODULE_REGEX) || []));

  let confidence = category === "unknown" ? "low" : "high";
  if (category === "move_abort" && stack.length === 0) {
    confidence = "medium";
  }

  const summary = category === "unknown" ? "Parsed Move error output" : `Detected ${category.replace(/_/g, " ")}`;

  return {
    category,
    summary,
    likely_cause: cause,
    fix_steps: fixes,
    confidence,
    abort_code: abortCode || "unknown",
    move_stack: stack,
    modules
  };
}
