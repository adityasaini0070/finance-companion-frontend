# 💰 Personal Finance Companion

A full-stack mobile app to track income, expenses, set savings goals, and receive AI-powered financial insights.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (CLI) |
| Backend | Java Spring Boot 3 |
| Database | MongoDB |
| AI | Google Gemini 2.0 Flash |
| Navigation | React Navigation v6 |
| HTTP Client | Axios |
| Charts | react-native-chart-kit |

---

## Features

- **Home Dashboard** — real-time balance, income/expense summary cards, 7-day line chart, recent transactions
- **Transactions** — full CRUD, search by keyword, filter by type and category, net total display
- **Add/Edit Transaction** — type toggle, amount input, category grid with icons, date picker, form validation
- **Goals** — monthly savings goals with progress bars, ACHIEVED / ON_TRACK / AT_RISK status badges
- **AI Insights** — Gemini-powered personalised financial tip, category pie chart, weekly bar chart, savings rate tracker

---

## Project Structure

```
├── FinanceApp/                  # React Native frontend
│   └── src/
│       ├── api/                 # Axios config + all API calls
│       ├── screens/             # 5 screens
│       ├── components/          # Reusable UI components
│       ├── navigation/          # Bottom tabs + stack navigator
│       └── theme/               # Colors and category config
│
└── financeapp-backend/          # Spring Boot backend
    └── src/main/java/com/example/financeapp/
        ├── Models/
        ├── Repositories/
        ├── Services/
        └── Controllers/         # REST + InsightController (Gemini)
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/transactions` | CRUD transactions |
| GET | `/api/transactions/summary` | Balance, income, expenses |
| GET | `/api/transactions/filter/type/{type}` | Filter by INCOME/EXPENSE |
| GET | `/api/transactions/filter/category/{cat}` | Filter by category |
| GET | `/api/transactions/search?keyword=` | Search transactions |
| GET/POST/PUT/DELETE | `/api/goals` | CRUD goals |
| PUT | `/api/goals/{id}/refresh` | Recalculate goal progress |
| GET | `/api/insights/ai` | Gemini AI financial tip |

---

## Getting Started

### Prerequisites
- Node.js 18+
- JDK 17+
- MongoDB running locally
- Android Studio with an emulator
- Google Gemini API key — free at https://aistudio.google.com/app/apikey

### Backend Setup
```bash
cd financeapp-backend
# Add your keys to src/main/resources/application.properties:
# spring.data.mongodb.uri=mongodb://localhost:27017/financedb
# gemini.api.key=YOUR_KEY_HERE
# server.port=8084

./mvnw spring-boot:run
```

### Frontend Setup
```bash
cd FinanceApp
npm install

# Update BASE_URL in src/api/axiosConfig.js to point to your backend
# For emulator with adb reverse: http://localhost:8084/api

npx react-native run-android
```

### adb reverse (required for emulator)
```bash
adb reverse tcp:8084 tcp:8084
adb reverse tcp:8081 tcp:8081
```

---

## Goal Status Logic

| Status | Condition |
|---|---|
| ACHIEVED | Progress ≥ 100% |
| ON_TRACK | Progress ≥ 50% |
| AT_RISK | Progress < 50% |

`currentSaved = totalIncome - totalExpenses` scoped to the goal's month and year.

---

## Technical Decisions

- **React Native CLI over Expo** — full native access needed for vector icons font linking and APK generation control
- **Axios with interceptors** — centralised API layer with logging and error normalisation
- **Direct Gemini REST calls** — used `RestTemplate` over Spring AI starter to avoid pre-release dependency issues. Prompt includes calculated summary (totals, savings rate, top category) for more actionable responses
- **MongoDB** — schema-flexible document storage suits evolving finance data models
- **NativeStack navigator** — used `@react-navigation/native-stack` over the JS stack for better performance and no gesture handler dependency issues

---

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `gemini.api.key` | `application.properties` | Google Gemini API key |
| `spring.data.mongodb.uri` | `application.properties` | MongoDB connection string |
| `BASE_URL` | `src/api/axiosConfig.js` | Backend URL |
