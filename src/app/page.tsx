"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/fetch";

// Types for LLM recommendations
type Tag = string;
type Genre = string;
type ParsedRecommendation = {
  title: string;
  genres: Genre[];
  tags: Tag[];
};

type LLMCandidate = {
  title: string;
  genres: Genre[];
  tags: Tag[];
  rating: number | null;
};

type LLMResponse = {
  user_input: string;
  raw_recommendations: string;
  parsed_recommendations: ParsedRecommendation[];
  candidates: LLMCandidate[];
};

// Types for similarity-based recommendations
type ConventionalRecommendation = {
  movieId: number;
  title: string;
  genres: Genre[];
  similarity_score: number;
};

type ConventionalRecommendationResponse = {
  query: string;
  recommendations: ConventionalRecommendation[];
};

export default function Home() {
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchKey, setSearchKey] = useState<number>(0); // Key to force re-fetch

  // Define custom fetchers for our POST requests
  const llmFetcher = (url: string) =>
    fetcher<LLMResponse>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_input: searchQuery, top_n: 20 }),
    });

  const similarityFetcher = (url: string) =>
    fetcher<ConventionalRecommendationResponse>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: searchQuery, top_n: 20 }),
    });

  // Helper function to normalize titles for comparison
  const cleanTitle = (title: string): string => {
    // Remove year and normalize case for comparison
    return title.replace(/\s*\(\d{4}\)$/, "").toLowerCase();
  };

  // Use SWR hooks with conditional fetching
  const {
    data: llmResults,
    error: llmError,
    isLoading: isLlmLoading,
  } = useSWR<LLMResponse>(
    searchQuery ? [`/recommend_llm`, searchKey] : null,
    () => llmFetcher("/recommend_llm"),
    { revalidateOnFocus: false }
  );

  const {
    data: similarityResults,
    error: similarityError,
    isLoading: isSimilarityLoading,
  } = useSWR<ConventionalRecommendationResponse>(
    searchQuery ? [`/recommend`, searchKey] : null,
    () => similarityFetcher("/recommend"),
    { revalidateOnFocus: false }
  );

  // Derive loading and error states
  const isLoading = isLlmLoading || isSimilarityLoading;
  const hasError = llmError || similarityError;

  // Calculate overlaps between recommendation sets
  const overlaps = (() => {
    if (
      !llmResults?.parsed_recommendations ||
      !similarityResults?.recommendations
    ) {
      return { count: 0, titles: [] };
    }

    const llmTitles = new Set(
      llmResults.parsed_recommendations.map((item) => cleanTitle(item.title))
    );

    const similarityTitles = similarityResults.recommendations.map((item) =>
      cleanTitle(item.title)
    );
    const overlappingTitles = similarityTitles.filter((title) =>
      llmTitles.has(title)
    );

    return {
      count: overlappingTitles.length,
      titles: overlappingTitles,
    };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // For new searches or repeated searches with the same query
    setSearchQuery(input);
    setSearchKey((prev) => prev + 1); // Increment to force re-fetch
  };

  const renderGenres = (genres: string[]) => (
    <div className="flex flex-wrap gap-1 mt-1">
      {genres.map((genre, idx) => (
        <span
          key={idx}
          className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs"
        >
          {genre}
        </span>
      ))}
    </div>
  );

  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded-full text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  const renderOverlaps = () => {
    if (!overlaps || overlaps.count === 0) return null;

    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg mb-4">
        <h2 className="text-lg font-bold">Overlap Analysis</h2>
        <p className="mb-2">
          Found {overlaps.count} overlapping recommendations between systems.
        </p>
        {overlaps.titles.length > 0 && (
          <div>
            <p className="font-medium">Overlapping movies:</p>
            <ul className="list-disc list-inside">
              {overlaps.titles.map((title, idx) => (
                <li key={idx} className="capitalize">
                  {title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-2xl font-bold text-center">Movie Recommender</h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Compare LLM vs Similarity-based recommendations
        </p>
      </header>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., Suggest me horror comedy from 2000s"
              className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`px-6 py-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400`}
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {/* Error State */}
        {hasError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg mb-4 max-w-2xl mx-auto">
            <h3 className="font-bold">Error fetching recommendations</h3>
            <p>
              There was a problem processing your request. Please try again.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Results Section */}
        {!isLoading && !hasError && (llmResults || similarityResults) && (
          <div>
            {/* Overlap Analysis */}
            {renderOverlaps()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LLM Results */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="font-bold">LLM Recommendations</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {llmResults?.parsed_recommendations.map((movie, idx) => (
                    <div
                      key={idx}
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        overlaps.titles.includes(cleanTitle(movie.title))
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : ""
                      }`}
                    >
                      <h3 className="font-medium">{movie.title}</h3>
                      {renderGenres(movie.genres)}
                      {renderTags(movie.tags)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Similarity Results */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="bg-green-50 dark:bg-green-900/30 p-3 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="font-bold">Conventional Recommendations</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {similarityResults?.recommendations.map((movie, idx) => (
                    <div
                      key={idx}
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        overlaps.titles.includes(cleanTitle(movie.title))
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : ""
                      }`}
                    >
                      <h3 className="font-medium">{movie.title}</h3>
                      {renderGenres(movie.genres)}
                      <div className="mt-1 text-xs text-gray-500">
                        Similarity: {(movie.similarity_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initial State - Empty */}
        {!isLoading && !hasError && !llmResults && !similarityResults && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">
              Movie Recommendation Comparison
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Enter a query about movies you&apos;re interested in, and
              we&apos;ll show you recommendations from both our LLM-based system
              and our conventional recommendation algorithm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
