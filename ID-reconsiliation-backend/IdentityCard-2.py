from fastapi import Request, FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import tempfile
import os
import ollama
import psycopg2
from datetime import datetime
import json
from docling.document_converter import DocumentConverter
from fastapi.encoders import jsonable_encoder

app = FastAPI()

DB_CONFIG = {
    "dbname": "pgvectordatabase",
    "user": "postgres",
    "password": "Penguins@1229",
    "host": "localhost",
    "port": "5434",
}

DATE_KEYS = {"date_of_birth", "issuing_date", "expiry_date"}


def parse_date(value):
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except:
            continue
    return None


def get_cleaned_content(uploaded_file: UploadFile):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = uploaded_file.file.read()
        tmp.write(content)
        tmp_path = tmp.name

    converter = DocumentConverter()
    result = converter.convert(tmp_path)
    cleaned_content = result.document.export_to_markdown()
    os.remove(tmp_path)
    return cleaned_content


def extract_json_from_markdown(content: str):
    prompt = f"""
    You are an intelligent document parser. Extract structured JSON data from text:

    Output only a JSON object with the following keys (if available): 
    - issuing_country
    - authority
    - card_type
    - full_name
    - surname
    - sex
    - date_of_birth
    - age
    - nationality
    - id_number
    - issuing_date
    - expiry_date
    - signature_present

    The following is a cleaned markdown document. Extract its sections into structured json format like I have mentioned above and put null if values are not available. Do not include any other text or explanation, just the JSON object.

    Markdown content:
    {content}
    """
    response = ollama.chat(
        model="llama3.2:3b", messages=[{"role": "user", "content": prompt}]
    )
    return json.loads(response["message"]["content"])


def calculate_similarity(json1: dict, json2: dict) -> float:
    matched = 0
    total = 0
    for key in json1:
        if key in json2:
            val1 = str(json1[key]).lower().strip()
            val2 = str(json2[key]).lower().strip()
            if val1 and val2:
                total += 1
                matched += int(val1 == val2)
    return round((matched / total) * 100 if total > 0 else 0, 2)


@app.post("/save")
async def save_final_form(request: Request):
    try:
        data = await request.json()
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        insert_query = """
        INSERT INTO identity_cards (
            issuing_country, authority, card_type, full_name, surname,
            sex, date_of_birth, age, nationality, id_number,
            issuing_date, expiry_date, signature_present
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(
            insert_query,
            (
                data.get("issuing_country"),
                data.get("authority"),
                data.get("card_type"),
                data.get("full_name"),
                data.get("surname"),
                data.get("sex"),
                parse_date(data.get("date_of_birth")),
                int(data.get("age")) if data.get("age") else None,
                data.get("nationality"),
                data.get("id_number"),
                parse_date(data.get("issuing_date")),
                parse_date(data.get("expiry_date")),
                data.get("signature_present") in ["true", "True", True, "yes"],
            ),
        )

        conn.commit()
        cursor.close()
        conn.close()

        return {"status": "success"}
    except Exception as e:
        return JSONResponse(
            content={"error": "Failed to save", "detail": str(e)}, status_code=500
        )


@app.post("/upload")
async def upload_two_documents(
    file1: UploadFile = File(...), file2: UploadFile = File(...)
):
    try:
        content1 = get_cleaned_content(file1)
        content2 = get_cleaned_content(file2)

        data1 = extract_json_from_markdown(content1)
        data2 = extract_json_from_markdown(content2)

        similarity = calculate_similarity(data1, data2)

        consolidated_details = {}
        for key in set(data1.keys()).union(data2.keys()):
            val1 = data1.get(key)
            val2 = data2.get(key)

            if key in DATE_KEYS:
                val1_date = parse_date(str(val1)) if val1 else None
                val2_date = parse_date(str(val2)) if val2 else None

                if val1_date and val2_date and val1_date == val2_date:
                    consolidated_details[key] = val1_date.isoformat()
                else:
                    consolidated_details[key] = {
                        "document_1": val1,
                        "document_2": val2,
                    }
            else:
                if str(val1).strip().lower() == str(val2).strip().lower():
                    consolidated_details[key] = val1
                else:
                    consolidated_details[key] = {
                        "document_1": val1,
                        "document_2": val2,
                    }

        return JSONResponse(
            content={
                "document_1_details": data1,
                "document_2_details": data2,
                "consolidated_details": consolidated_details,
                "similarity_percentage": similarity,
            }
        )

    except Exception as e:
        return JSONResponse(
            content={"error": "Processing failed", "detail": str(e)}, status_code=500
        )
