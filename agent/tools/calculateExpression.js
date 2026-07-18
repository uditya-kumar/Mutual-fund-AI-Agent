import { tool } from "@openai/agents";
import { z } from "zod";
import { create, all } from "mathjs";

// Initialize mathjs with all functions
const math = create(all);

// Tool: Calculate mathematical expressions
export const calculateExpression = tool({
  name: "calculate",
  description: `Evaluate any mathematical expression using mathjs. Supports:
- Basic operations: +, -, *, /, ^, sqrt(), abs(), round()
- Statistics: mean(), median(), std(), variance(), min(), max(), sum()
- Financial: Use formulas like CAGR = ((finalValue/initialValue)^(1/years) - 1) * 100
- SIP Future Value: P * (((1 + r)^n - 1) / r) * (1 + r) where r = annual_rate/1200, n = years*12
- Arrays: [1, 2, 3] for statistical operations
- Constants: pi, e
- Functions: log(), exp(), sin(), cos(), pow(), etc.

Include all values directly in the expression string. For example: '((94.14 / 86.99) ^ (1/1) - 1) * 100' for CAGR calculation.`,
  parameters: z.object({
    expression: z
      .string()
      .describe("Mathematical expression to evaluate with all values included directly"),
  }),
  async execute({ expression }) {
    console.log("🔨 Calling Calculate Expression tool");
    try {
      const result = math.evaluate(expression);

      let formattedResult;
      if (typeof result === "number") {
        formattedResult = math.round(result, 6);
      } else if (Array.isArray(result)) {
        formattedResult = result.map((r) =>
          typeof r === "number" ? math.round(r, 6) : r
        );
      } else {
        formattedResult = result;
      }

      return JSON.stringify({
        expression: expression,
        result: formattedResult,
      });
    } catch (error) {
      return JSON.stringify({
        error: error.message,
        hint: "Check expression syntax. Use * for multiplication, ^ for power, and proper parentheses.",
      });
    }
  },
});
