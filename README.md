# FinDash: Advanced Interactive Financial Dashboard

FinDash is an enterprise-grade, frontend-driven financial dashboard application. It enables users to cleanly monitor balances, trace market trends, visualize categorized expenses, and securely manage their transactional history from a unified, meticulously designed single viewport.

## 🚀 Features

- **Dynamic Summary Overview**: Instantly view Total Balances aligned alongside strict definitions of recent Income versus Expenses.
- **Data Visualizations**: Track month-to-month momentum with smooth `recharts` powered Area trend charts and interactive categorical Pie graphs.
- **Robust Transaction Management**: Advanced parsing, searching, categorizing, mapping, and explicitly sorting chronological histories.
- **Role-Based Access Control Simulator**: Toggle natively between Viewer and Admin modes. Unleash "+ Add", "Edit", and "Delete" capabilities dynamically reserved strictly for privileged roles.
- **Context API Architecture**: Scalable, decoupled state management eliminating prop drilling.
- **Responsive Animations**: Beautiful entrance framing utilizing staggered CSS keyframes and subtle `pulse`/`slide`/`fade` transitions.
- **Subtle WebGL Backbone**: Smooth ambient background shaders mapped securely behind the dashboard rendering context.
- **Intelligent Insights**: Automated percentage-based metric comparisons calculating negative/positive trajectory over rolling windows natively.
- **Data Export & Persistence**: Push-button CSV generation mapped directly to filtered contexts, completely backed by zero-dependency `localStorage` retention mapping.

## 🛠️ Technology Stack

- **Framework**: `React 19` alongside `TypeScript`
- **Build Engine**: `Vite`
- **Data Visualization**: `Recharts`
- **Iconography**: `lucide-react`
- **Styling Strategy**: Native decoupled CSS paired with CSS Custom Variables enabling seamless deep/light mode shifting.

## 📦 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine. 

### 2. Installation
Clone the repository, navigate into the main directory, and simply install dependencies via NPM.
```bash
npm install
```

### 3. Running the Server locally
To start the Vite hot-reloading development server:
```bash
npm run dev
```

The application will typically map directly to [http://localhost:5173](http://localhost:5173). 

## 🌙 Activating Dark Mode
Click the elegant toggle switch in the application header to gracefully switch the `[data-theme]` payload, triggering a unified dark mode that scales natively across the canvas shaders, chart tooltips, and component backgrounds.

## 💸 Admin vs Viewer Modes
Using the Role selection dropdown:
- Selecting **Viewer** locks the workspace logically, allowing for analysis and export.
- Selecting **Admin** immediately injects privileged `+ Add` interfaces and inline transaction-modification commands.

Enjoy analyzing your layout!

## 🤔 Technical Decisions and Trade-offs

During the development of FinDash, several key technical choices were made to explicitly balance performance, development velocity, and premium aesthetic requirements:

1. **Context API over Redux/Zustand**: For state management, the native `Context API` paired with custom hooks (`useDashboard`) was chosen. It provides sufficient decoupling to prevent prop-drilling without the boilerplate or bundle size overhead of a heavier state library, which is ideal for a focused frontend dashboard.
2. **Native CSS Variables for Theming**: Instead of an external css-in-js library (like styled-components or Emotion) or TailwindCSS, pure CSS custom variables (`[data-theme='dark']`) were utilized. This approach guarantees zero runtime overhead for style parsing while keeping dynamic dark/light mode transitions incredibly swift and buttery smooth.
3. **Client-Side RBAC Simulation**: To keep the repository completely entirely self-contained and frontend-driven, the Role-Based Access Control (Viewer vs. Admin) is simulated via application-level state rather than secured by an external backend or JWT system. This speeds up the demonstration capacity but trades off strict security, which would be fundamentally required for production.
4. **Recharts for Data Visualization**: `recharts` was chosen as a balanced middle-ground. It allows for declarative SVG charting within React easily. While D3.js would offer more custom flexibility, Recharts provides immediate stability, out-of-the-box responsiveness, and elegant React-native composition suitable for the project's tight scope.
5. **WebGL Shader Integration**: Incorporating a WebGL canvas background significantly elevates the "premium" feel of the UI. The trade-off explicitly sacrifices some baseline rendering performance on lower-end devices to provide a top-tier aesthetic.
