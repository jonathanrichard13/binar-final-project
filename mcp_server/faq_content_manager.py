import os
import re
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class FAQContentManager:
    """Manages loading and processing of FAQ content files"""

    def __init__(self, faq_directory: str):
        self.faq_directory = Path(faq_directory)
        self.faq_content = {}
        self.last_loaded = None

        # Ensure FAQ directory exists
        if not self.faq_directory.exists():
            raise FileNotFoundError(f"FAQ directory not found: {faq_directory}")

    def load_all_faqs(self) -> Dict[str, List[Dict[str, str]]]:
        """Load all FAQ files and organize content by file"""
        self.faq_content = {}

        # Find all .txt files in FAQ directory
        faq_files = list(self.faq_directory.glob("*.txt"))

        if not faq_files:
            logging.warning(f"No FAQ files found in {self.faq_directory}")
            return self.faq_content

        for faq_file in faq_files:
            try:
                file_content = self._parse_faq_file(faq_file)
                if file_content:
                    self.faq_content[faq_file.name] = file_content
                    logging.info(
                        f"Loaded FAQ file: {faq_file.name} with {len(file_content)} Q&A pairs"
                    )
            except Exception as e:
                logging.error(f"Error loading FAQ file {faq_file.name}: {e}")

        self.last_loaded = datetime.now()
        logging.info(
            f"Loaded {len(self.faq_content)} FAQ files with total {self._count_total_qas()} Q&A pairs"
        )
        return self.faq_content

    def _parse_faq_file(self, file_path: Path) -> List[Dict[str, str]]:
        """Parse individual FAQ file and extract Q&A pairs"""
        qa_pairs = []

        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()

        # Split content into potential Q&A blocks
        # Look for patterns like "Q:" or "Question:" followed by "A:" or "Answer:"
        qa_pattern = r"Q:\s*(.*?)\s*A:\s*(.*?)(?=Q:|$)"
        matches = re.findall(qa_pattern, content, re.DOTALL | re.IGNORECASE)

        for question, answer in matches:
            # Clean up whitespace and formatting
            question = self._clean_text(question)
            answer = self._clean_text(answer)

            if question and answer:
                qa_pairs.append({"question": question, "answer": answer})

        return qa_pairs

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        # Remove extra whitespace and normalize
        text = re.sub(r"\s+", " ", text.strip())
        return text

    def _count_total_qas(self) -> int:
        """Count total number of Q&A pairs across all files"""
        return sum(len(qa_list) for qa_list in self.faq_content.values())

    def get_structured_content_for_claude(self) -> str:
        """Format all FAQ content for Claude analysis"""
        if not self.faq_content:
            self.load_all_faqs()

        formatted_content = []

        for filename, qa_pairs in self.faq_content.items():
            # Remove .txt extension for cleaner display
            file_title = filename.replace(".txt", "").replace("_", " ").title()

            formatted_content.append(f"\n=== {file_title} ({filename}) ===")

            for i, qa in enumerate(qa_pairs, 1):
                formatted_content.append(f"\nQ{i}: {qa['question']}")
                formatted_content.append(f"A{i}: {qa['answer']}")

        return "\n".join(formatted_content)

    def extract_answer_from_file(self, filename: str, query: str) -> Optional[str]:
        """Extract specific answer from identified FAQ file"""
        if filename not in self.faq_content:
            return None

        qa_pairs = self.faq_content[filename]

        # For now, return the first answer from the file
        # In a more sophisticated implementation, we could do semantic matching
        # within the file to find the most relevant Q&A pair
        if qa_pairs:
            return qa_pairs[0]["answer"]

        return None

    def get_file_summary(self) -> Dict[str, int]:
        """Get summary of loaded FAQ files"""
        return {
            filename: len(qa_pairs) for filename, qa_pairs in self.faq_content.items()
        }

    def reload_if_needed(self) -> bool:
        """Check if FAQ files need reloading and reload if necessary"""
        # Simple implementation - could be enhanced to check file modification times
        if not self.last_loaded:
            self.load_all_faqs()
            return True
        return False
