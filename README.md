# Meru Lead Manager

A compact full-stack lead-management app prepared for the Meru Technosoft Pvt. Ltd. Full Stack Developer screening assignment.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Validation: express-validator + frontend checks

## Features
- Create, list, edit and delete leads
- Lead fields: name, email, phone, company, source and status
- Search by name/company/email and filter by status
- Status summary cards
- Delete confirmation
- Server-side validation and consistent API errors

## Requirements
Node.js 20+ and MongoDB (local or Atlas).

## Run locally
Open two terminals.

### 1. Backend
```bash
cd server
npm install
npm run dev
```
Before starting, copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell, or `cp .env.example .env` on macOS/Linux). Set `MONGODB_URI` if needed. The API runs at `http://localhost:5000`.

### 2. Frontend
```bash
cd client
npm install
npm run dev
```
Before starting, copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell, or `cp .env.example .env` on macOS/Linux).
Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## API
Base URL: `/api`
- `GET /leads?search=&status=`
- `GET /leads/:id`
- `POST /leads`
- `PUT /leads/:id`
- `DELETE /leads/:id`
- `GET /health`

## Assumptions and scope
- Single shared workspace; authentication is not included.
- Search includes name, company and email.
- Newest leads appear first.
- Deletion requires browser confirmation.

## Improvements with more time
Add authentication and user-specific lead ownership, pagination, richer automated integration tests, accessibility refinements, and deploy the API with a hosted MongoDB database.

## Submission note
The assignment requests a public Git repository link; submit that link in the application/email thread rather than emailing a ZIP.

## What I found tricky
Keeping API-side validation aligned with the editable lead form while allowing the status filter and search to work together. I’m proud that the core create, read, update, and delete flows share one consistent lead model and status vocabulary.
