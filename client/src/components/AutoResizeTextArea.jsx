import React, { useRef, useEffect } from "react";

const AutoResizeTextArea = ({ content, setContent }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // reset height
      textarea.style.height = textarea.scrollHeight + "px"; // expand to fit
    }
  }, [content]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full mt-4 text-sm outline-none placeholder-gray-400 resize-none overflow-hidden"
      placeholder="What's happening?"
      onChange={(e) => setContent(e.target.value)}
      value={content}
    />
  );
};

export default AutoResizeTextArea;
