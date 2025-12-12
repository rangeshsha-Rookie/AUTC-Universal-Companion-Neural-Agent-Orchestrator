<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>
# AUTC: Universal Companion & Neural Agent Orchestrator

![AUTC Banner](https://raw.githubusercontent.com/google-gemini/cookbook/main/gemini-2/images/gemini-2-banner.png) 
**AUTC** is an advanced multi-agent orchestration system powered by **Gemini 2.5 Flash**. It acts as a "Neural Link" between the user and a collective of specialized AI agents, automatically routing tasks to the expert module best suited for the job—whether that's scientific research, coding, or accessibility support.

## 📺 Project Demo
[![Watch the Demo](https://img.youtube.com/vi/7qRWj3wQHEs/0.jpg)](https://www.youtube.com/watch?v=7qRWj3wQHEs)
*Click the image above to watch the full walkthrough.*

## 🚀 Key Features

* **🧠 Universal Orchestrator:** Analyzes user intent in real-time to route queries to specialized agents without manual switching.
* **⚡ Powered by Gemini 2.5 Flash:** Leverages the massive context window and speed of the newest Gemini model for seamless context switching.
* **📂 Neural Memory Bank:** A persistent storage layer that archives code snippets, conversation history, and strategic insights.
* **🗣️ Voice Output (TTS):** Integrated Text-to-Speech for a fully accessible, conversational experience.

## 🛠️ Specialized Agents

AUTC replaces the general chatbot experience with distinct personas:
* **🧬 Science Agent:** Empirical research, data analysis, and physics concepts.
* **🎓 Education Agent:** Simplifies complex topics, generates quizzes, and acts as a tutor.
* **💻 Technology Agent:** Handles code generation, debugging, and system architecture.
* **🏥 Health Agent:** Wellness tips, medical data interpretation, and fitness guidance.
* **♿ Accessibility Agent:** Text-to-speech prep, simplification, and visual descriptions.
* **💼 Business Agent:** Strategic planning and professional communication.

## 🏗️ Architecture

The system uses a central "Task Commander" node (The Orchestrator) which evaluates the semantic meaning of every prompt.
1.  **Input:** User provides text or voice input.
2.  **Analysis:** The Orchestrator (Gemini 2.5) classifies the intent.
3.  **Routing:** The context is passed to the specific Specialist Agent.
4.  **Response:** The Agent responds, and the interaction is saved to the Neural Memory Bank.

## 🔧 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/autc-companion.git](https://github.com/your-username/autc-companion.git)
    cd autc-companion
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment**
    Create a `.env` file and add your Google AI Studio API key:
    ```bash
    REACT_APP_GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the App**
    ```bash
    npm start
    ```

## 🤝 Contribution

This project was built for the **Gemini API Developer Competition**.
Feel free to fork the repo and submit Pull Requests to add new Specialist Agents!

---
*Built with ❤️ using Google Gemini 2.5 Flash.*
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1aN40U1wfm-Cf29dgQuTqOrUKtvCBr1Or

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
