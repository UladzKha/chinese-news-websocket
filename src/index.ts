import express, {Request, Response} from 'express';
import dotenv from "dotenv";
import {EventEmitter} from "node:events";
import connectDB from "./config/db";
import Article, {IArticle} from "./models/Article";
import {sendMessage} from "./services/telegramService";
import cors from 'cors';

dotenv.config();
connectDB();

type CorsCallback = (error: Error | null, allow?: boolean) => void;


const validateOrigin = (origin: string | undefined, callback: CorsCallback) => {
    if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)
    if (origin.startsWith('chrome-extension://')) {
        return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
};

const app = express();
const port = 3000;
const eventEmitter = new EventEmitter();

app.use(cors({
    origin: validateOrigin
}));

app.use('/api/updates', (req, res) => {
    console.log('New SSE connection established');
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const sendUpdate = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    eventEmitter.on('update', sendUpdate);

    req.on('close', () => {
        console.log('SSE connection closed');
        eventEmitter.off('update', sendUpdate);
    });
})

export function emitUpdate(data: IArticle) {
    eventEmitter.emit('update', data);
}

const changeStream = Article.watch();

changeStream.on('change', async (change) => {
    if (change.operationType === 'insert') {
        const document = change.fullDocument as IArticle;

        console.log({document}, 'DOCUMENT');

        emitUpdate(document);

        await sendMessage({
            translatedTitle: document.translatedTitle,
            url: document.url,
            significance: document.significance as 'low' | 'medium' | 'high',
            translatedContent: document.translatedContent,
            source: document.source,
            tags: document.tags,
        });
    }
},);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript with Express!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
