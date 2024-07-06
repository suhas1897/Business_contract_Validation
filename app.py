from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from io import BytesIO
from PyPDF2 import PdfReader

app = Flask(__name__)
CORS(app)
nlp = spacy.load('en_core_web_sm')

KEYWORDS = ["agreement", "party", "confidential", "termination", "liability"]

DEFAULT_TEMPLATE_TEXT = """
This agreement is made between Castro Ltd (hereinafter referred to as 'Party A') and Contreras Group (hereinafter referred to as 'Party B').

The agreement will commence on 2024-05-23 and will continue until 2024-02-29. Party A and Party B agree to the terms and conditions outlined in this document.

Both parties agree to keep confidential any proprietary information disclosed during the term of this agreement. This clause shall remain in effect for a period of 5 years following the termination of this agreement.

This agreement may be terminated by either party upon 82 days written notice to the other party.

Neither party shall be liable for any indirect, incidental, or consequential damages arising out of or in connection with this agreement.


"""

def extract_text_from_pdf(pdf_file):
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def highlight_text(text, keywords):
    for keyword in keywords:
        text = text.replace(keyword, f"<mark>{keyword}</mark>")
    return text

def parse_contract(contract_text):
    doc = nlp(contract_text)
    clauses = []
    entities = []
    highlighted_text = contract_text
    for ent in doc.ents:
        entities.append({'text': ent.text, 'label': ent.label_, 'score': ent.kb_id_ if ent.kb_id_ else 1.0})
    for sent in doc.sents:
        clause = {'text': sent.text, 'keywords': []}
        for keyword in KEYWORDS:
            if keyword in sent.text.lower():
                clause['keywords'].append(keyword)
                highlighted_text = highlighted_text.replace(keyword, f"<mark>{keyword}</mark>")
        clauses.append(clause)
    return clauses, entities, highlighted_text

def highlight_deviations(parsed_clauses, template_clauses):
    deviations = []
    template_texts = [clause['text'] for clause in template_clauses]
    for clause in parsed_clauses:
        if clause['text'] not in template_texts:
            deviations.append(clause)
    return deviations

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'contract' not in request.files:
        return jsonify({'error': 'Contract file is required'}), 400

    contract_file = request.files['contract']
    contract_text = extract_text_from_pdf(contract_file) if contract_file.filename.endswith('.pdf') else contract_file.read().decode('utf-8')

    if 'template' in request.files:
        template_file = request.files['template']
        template_text = extract_text_from_pdf(template_file) if template_file.filename.endswith('.pdf') else template_file.read().decode('utf-8')
    else:
        template_text = DEFAULT_TEMPLATE_TEXT

    parsed_contract_clauses, contract_entities, highlighted_contract_text = parse_contract(contract_text)
    parsed_template_clauses, _, _ = parse_contract(template_text)
    deviations = highlight_deviations(parsed_contract_clauses, parsed_template_clauses)

    return jsonify({
        'parsed_clauses': parsed_contract_clauses,
        'deviations': deviations,
        'entities': contract_entities,
        'highlighted_contract_text': highlighted_contract_text
    })

if __name__ == '__main__':
    app.run(debug=True)
