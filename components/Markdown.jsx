import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders the AI's Markdown output with GitHub-flavoured extras (tables, etc.).
export default function Markdown({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ""}</ReactMarkdown>
    </div>
  );
}
