import express from 'express';
import { EvaluationName, getEvaluationNames } from '../assets/data/evaluations.js';
import { IEvaluation } from '../web/store/EvaluationContext.js';
import { generateCode } from './CodeGeneration.js';
import db from './database.js';
import cors from 'cors';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer(
    {
        storage: storage,
        limits: {
            fileSize: 20 * 1024 * 1024
        }
    });

function generateUniqueCode(evaluation: EvaluationName, callback: (err: Error | null, code?: string) => void) {
    const code = generateCode(evaluation);

    // Check if code already exists in the database
    db.get('SELECT * FROM codes WHERE code = ?', [code], (err, row) => {
        if (err) {
            console.error(err.message);
            return callback(err);
        }

        // If code already exists, recursively call generateUniqueCode again
        if (row) {
            return generateUniqueCode(evaluation, callback);
        }

        // If code does not exist, return it through callback
        callback(null, code);
    });
}

app.post('/result/submit', upload.single('results'), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'File is required' });
    }

    const body = JSON.parse(file.buffer.toString()) as IEvaluation;
    console.log(body)
    const code = body.user.code;
    const consentGiven = body.user.consentGiven;
    if (!code || !consentGiven) {
        return res.status(400).json({ error: 'Code and consent are required' });
    }

    // version is the number of times the user has submitted the evaluation
    db.get('SELECT * FROM evaluations WHERE code = ? ORDER BY version DESC LIMIT 1', [code], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const version = row ? (row as { version: number }).version + 1 : 1;

        db.run('INSERT INTO evaluations (code, data, version) VALUES (?, ?, ?)', [code, JSON.stringify(body), version], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            console.log(`Evaluation submitted with code ${code} and version ${version}`);
            res.json({ version });
        });
    });
});

app.post('/code/validate', (req, res) => {
    // get code from request body
    const code = req.body.code as string;

    // check if code is valid
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    // check if code exists in the database
    db.get('SELECT * FROM codes WHERE code = ?', [code], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // if code does not exist, return error
        if (!row) {
            return res.status(404).json({ error: 'Code not found' });
        }

        // if code exists, return evaluation name
        res.json({ evaluation: (row as { evaluation: string }).evaluation });
    });
});

app.get('/code/gen', (req, res) => {
    // get query param of type EvaluationName
    let evaluation = req.query.evaluation as string;
    console.log(evaluation)
    // verify that the evaluation is a valid EvaluationName
    if (!evaluation || !getEvaluationNames().includes(evaluation as EvaluationName)) {
        evaluation = "Layperson";
    }

    // generate a code
    generateUniqueCode(evaluation as EvaluationName, (err, code) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Insert the new code into database
        db.run('INSERT INTO codes (evaluation, code) VALUES (?, ?)', [evaluation, code], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            // Send the generated code as JSON response
            res.json({ code });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is now running at http://localhost:${PORT}`);
});