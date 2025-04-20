"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "system";
  content: string;
};

type ChatHistory = {
  id: string;
  title: string;
  updatedAt: Date;
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([
    {
      id: "1",
      title: "Movie recommendations for date night",
      updatedAt: new Date(),
    },
    { id: "2", title: "Sci-fi movies from the 90s", updatedAt: new Date() },
    { id: "3", title: "Best comedy movies of all time", updatedAt: new Date() },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate system response (in a real app, this would be an API call)
    setTimeout(() => {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: `Based on your interest in "${input}", I recommend checking out these movies:\n\n1. The Shawshank Redemption (1994)\n2. Inception (2010)\n3. Interstellar (2014)`,
      };
      setMessages((prev) => [...prev, systemMessage]);
    }, 1000);

    setInput("");
  };

  const startNewChat = () => {
    setMessages([]);
    // In a real app, you might create a new chat in the backend here
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: "New movie recommendations",
      updatedAt: new Date(),
    };
    setChatHistories((prev) => [newChat, ...prev]);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-[#202123] text-white transition-all duration-300 flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="font-bold text-lg">Movie Recommender</div>
        </div>

        <button
          onClick={startNewChat}
          className="mx-4 my-3 p-3 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
        >
          + New Chat
        </button>

        <div className="flex-grow overflow-y-auto">
          {chatHistories.map((chat) => (
            <div
              key={chat.id}
              className="px-4 py-3 hover:bg-gray-700 cursor-pointer"
            >
              <h3 className="text-sm font-medium truncate">{chat.title}</h3>
              <p className="text-xs text-gray-400">
                {chat.updatedAt.toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center h-14 border-b border-gray-200 dark:border-gray-800 px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="ml-4 text-lg font-medium">Movie Recommender</h1>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-grow overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-4xl mb-6">🎬</div>
              <h2 className="text-2xl font-bold mb-2">Movie Recommender AI</h2>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                Ask me about movie recommendations based on your mood,
                preferences, or favorite genres.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.role === "user" ? "text-right" : ""
                }`}
              >
                <div
                  className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">
                    {message.content}
                  </pre>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for movie recommendations..."
              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-800"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
