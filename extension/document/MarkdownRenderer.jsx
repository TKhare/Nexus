import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { getImage } from '../utils/imageStorage.js';
import 'katex/dist/katex.min.css';

// Image component that loads from IndexedDB
function MarkdownImage({ src, alt, ...props }) {
  const [imageSrc, setImageSrc] = useState(src);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      // If src is already a data URL, use it
      if (src && src.startsWith('data:')) {
        setImageSrc(src);
        setLoading(false);
        return;
      }

      // Try to extract capture ID from the path
      // Format: images/capture_xxx.png
      const match = src && src.match(/images\/(capture_[^.]+)/);
      if (match && match[1]) {
        const captureId = match[1];
        const storedImage = await getImage(captureId);
        if (storedImage) {
          setImageSrc(storedImage);
        }
      }
      setLoading(false);
    };
    loadImage();
  }, [src]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Loading image...</div>;
  }

  return (
    <img
      src={imageSrc}
      alt={alt || 'Screenshot'}
      {...props}
      style={{
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginTop: '8px',
        marginBottom: '8px'
      }}
    />
  );
}

export default function MarkdownRenderer({ markdown }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom image rendering
          img: MarkdownImage,
          // Custom link rendering
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#4A90E2',
                textDecoration: 'none'
              }}
            />
          ),
          // Custom code block rendering
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code
                {...props}
                style={{
                  background: '#f5f5f5',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                }}
              />
            ) : (
              <code
                {...props}
                style={{
                  display: 'block',
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                }}
              />
            )
          )
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
