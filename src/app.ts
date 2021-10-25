import routes from '@routes/routes';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';

const app = express();

app.use(express.json());
app.use(cors());

app.use(routes);

export default app;
