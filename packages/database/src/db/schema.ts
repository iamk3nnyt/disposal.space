import { pgTable, text, varchar } from "drizzle-orm/pg-core";

// Knowledge Base Questions Table - Matches frontend interface exactly
export const knowledgeBaseQuestions = pgTable("knowledge_base_questions", {
  // Core fields that match frontend KnowledgeBaseArticle interface
  id: varchar("id", { length: 255 }).primaryKey(), // matches frontend id
  slug: varchar("slug", { length: 255 }).unique().notNull(), // matches frontend slug
  question: text("question").notNull(), // matches frontend question
  answer: text("answer").notNull(), // matches frontend answer (markdown content)
  readTime: varchar("read_time", { length: 20 }).notNull(), // matches frontend readTime
  publishedAt: varchar("published_at", { length: 20 }).notNull(), // matches frontend publishedAt (string format)
  tags: text("tags").array().notNull(), // matches frontend tags (string[])
  relatedQuestions: text("related_questions").array().notNull(), // matches frontend relatedQuestions (string[])
  questionNumber: varchar("question_number", { length: 20 }).notNull(), // matches frontend questionNumber
});

// Infer types from schema
export type SelectKnowledgeBaseQuestion =
  typeof knowledgeBaseQuestions.$inferSelect;
export type InsertKnowledgeBaseQuestion =
  typeof knowledgeBaseQuestions.$inferInsert;

// Frontend-compatible type that matches the KnowledgeBaseArticle interface
export type KnowledgeBaseArticle = {
  id: string;
  slug: string;
  question: string;
  answer: string;
  readTime: string;
  publishedAt: string;
  tags: string[];
  relatedQuestions: string[];
  questionNumber: string;
};

// Frontend-compatible type for related articles
export type RelatedArticle = {
  id: string;
  slug: string;
  question: string;
  readTime: string;
  publishedAt: string;
};
