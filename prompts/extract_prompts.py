import json
import os


def extract_prompts():
    with open("dummy-data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # Extract all user prompts from the requests
    prompts = []
    for i, request in enumerate(data.get("requests", []), 1):
        message_text = request.get("message", {}).get("text", "")
        if message_text.strip():
            prompts.append(
                {
                    "index": i,
                    "request_id": request.get("requestId", ""),
                    "text": message_text,
                }
            )

    print(f"Found {len(prompts)} user prompts")

    # Create individual txt files for each prompt
    for prompt in prompts:
        filename = f"prompt_{prompt['index']:02d}.txt"

        # Clean the text and remove carriage returns
        clean_text = prompt["text"].replace("\r\n", "\n").replace("\r", "\n")

        with open(filename, "w", encoding="utf-8") as f:
            f.write(clean_text)

        print(f"Created {filename}: {clean_text[:100]}...")


if __name__ == "__main__":
    extract_prompts()
