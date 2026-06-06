import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-3.5-flash")

SYSTEM_PROMPT = """You are a database architect AI.
The user will describe an application they want to build.
You must respond with ONLY a valid JSON object matching the ForgeAI config schema below.
No explanation, no markdown, no code fences, no extra text — pure raw JSON only.

SCHEMA:
{
  "appName": "string (Title Case)",
  "description": "string",
  "tables": [
    {
      "name": "string (snake_case, no spaces)",
      "label": "string (human readable)",
      "fields": [
        {
          "name": "string (snake_case)",
          "label": "string (human readable)",
          "type": "text|textarea|number|email|date|select|checkbox|url",
          "required": true,
          "options": ["string"]
        }
      ]
    }
  ],
  "views": [
    {
      "id": "string",
      "type": "table|form|dashboard",
      "table": "string",
      "title": "string"
    }
  ],
  "workflows": [
    {
      "trigger": "on_create|on_update|on_delete",
      "table": "string",
      "action": "log_event|send_email|webhook"
    }
  ]
}

RULES:
- Table names: snake_case, no spaces, no special chars
- Every table needs at least 2 fields beyond id/timestamps
- Field types must be exactly one of the listed types
- Select fields must have at least 2 options array items
- Every app needs at least one table view and one form view
- Maximum 8 tables, maximum 15 fields per table
- If description is unclear, make smart assumptions"""


async def generate_config(prompt: str) -> dict:
    full_prompt = f"{SYSTEM_PROMPT}\n\nUser request: {prompt}"
    for attempt in range(2):
        try:
            result = model.generate_content(full_prompt)
            text = result.text.strip().replace("```json", "").replace("```", "").strip()
            import json
            return json.loads(text)
        except Exception as e:
            if attempt == 1:
                raise ValueError("AI_PARSE_FAILED") from e
    raise ValueError("AI_PARSE_FAILED")


async def refine_config(current_config: dict, prompt: str) -> dict:
    import json
    refine_prompt = f"""You are modifying an existing ForgeAI app config.
Current config: {json.dumps(current_config, indent=2)}
User request: {prompt}
Return the COMPLETE updated config as pure JSON.
Preserve all existing tables and data. Only change what the user explicitly requests.
Follow the same schema and rules as before."""

    for attempt in range(2):
        try:
            result = model.generate_content(refine_prompt)
            text = result.text.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            if attempt == 1:
                raise ValueError("AI_PARSE_FAILED") from e
    raise ValueError("AI_PARSE_FAILED")
