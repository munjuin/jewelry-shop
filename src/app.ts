import express, { Request, Response } from 'express';

const app = express();
const port: number = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript Server!');
});

app.listen(port, () => {
  console.log(`✅ TS Server is running on http://localhost:${port}`);
});