from flask import Flask, request, jsonify
import pickle
import numpy as np
from flask_cors import CORS
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes and all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Path to your model file
MODEL_PATH = "organ_match_predictor.pkl"

# Check if model exists
if not os.path.exists(MODEL_PATH):
    logger.warning(f"Model file {MODEL_PATH} not found. Using fallback predictions.")
    model = None
else:
    try:
        # Load your trained model
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model = None

@app.route('/predict', methods=['POST'])
def predict():
    logger.info("Received prediction request")
    
    try:
        # Get data from request
        data = request.get_json()
        logger.info(f"Request data: {data}")
        
        # Extract features from request JSON
        donor_age = int(data.get('donor_age', 0))
        recipient_age = int(data.get('recipient_age', 0))
        organ_code = int(data.get('organ_code', 1))
        blood_code = int(data.get('blood_code', 1))
        
        input_features = [donor_age, recipient_age, organ_code, blood_code]
        logger.info(f"Input features: {input_features}")
        
        # Calculate compatibility percentage
        age_diff = abs(donor_age - recipient_age)
        
        # Base compatibility factors
        age_compatibility = max(0, 100 - (age_diff * 5))  # 0% at 20 years difference
        
        # Organ-specific compatibility factors (adjust these based on medical data)
        organ_factors = {
            1: 10,    # Kidney (bonus)
            2: -20,   # Heart (penalty)
            3: -5,    # Liver (slight penalty)
            4: -15,   # Lungs (penalty)
            5: -10,   # Pancreas (penalty)
            6: 15     # Cornea (big bonus)
        }
        organ_adjustment = organ_factors.get(organ_code, 0)
        
        # Blood group compatibility factor
        blood_compatibility = 90  # Default high compatibility
        # Adjust based on blood code (simplified logic)
        if blood_code >= 7:  # O blood types are universal donors
            blood_compatibility = 100
        
        # Calculate overall compatibility percentage
        compatibility_score = (age_compatibility * 0.4) + (blood_compatibility * 0.4) + organ_adjustment
        compatibility_percentage = max(0, min(100, round(compatibility_score)))
        
        # Surgery success calculation
        base_success = 85  # Base success rate
        age_penalty = min(age_diff * 2, 30)  # Age difference penalty, max 30%
        organ_factor = {1: 0, 2: -10, 3: -5, 4: -15, 5: -10, 6: 5}.get(organ_code, 0)
        
        surgery_success = max(20, min(95, base_success - age_penalty + organ_factor))
        
        # Death risk calculation
        base_risk = 100 - surgery_success
        risk_adjustment = 5 if age_diff > 10 else 0
        death_risk = max(5, min(80, base_risk + risk_adjustment))
        
        # Prepare response
        response = {
            'compatibility': compatibility_percentage > 60,  # Boolean compatibility (for backward compatibility)
            'compatibilityPercentage': compatibility_percentage,
            'surgerySuccess': round(surgery_success),
            'deathRisk': round(death_risk)
        }
        
        logger.info(f"Returning prediction: {response}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        # Return fallback values on error
        return jsonify({
            'compatibility': False,
            'compatibilityPercentage': 45,
            'surgerySuccess': 50,
            'deathRisk': 50,
            'error': str(e)
        }), 200

@app.after_request
def after_request(response):
    # Add additional headers to help with CORS
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    logger.info("Starting Flask server")
    app.run(debug=True, host='127.0.0.1', port=5000)