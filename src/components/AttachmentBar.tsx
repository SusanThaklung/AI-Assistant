/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Attachment } from '../types';
import { Paperclip, X, Image as ImageIcon, FileCode, FileText } from 'lucide-react';

interface AttachmentBarProps {
  attachments: Attachment[];
  onAddAttachment: (att: Attachment) => void;
  onRemoveAttachment: (id: string) => void;
  disabled?: boolean;
}

export const AttachmentBar: React.FC<AttachmentBarProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 without data:...;base64, prefix
          const base64Data = result.split(',')[1];
          onAddAttachment({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type: file.type || 'image/png',
            size: file.size,
            previewUrl: result,
            base64Data,
          });
        };
        reader.readAsDataURL(file);
      } else {
        // Text or code file
        const textReader = new FileReader();
        textReader.onload = () => {
          const content = textReader.result as string;
          onAddAttachment({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            content,
          });
        };
        textReader.readAsText(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.txt,.md,.c,.cpp,.java,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Attachments pills preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-neutral-100/90 rounded-lg border border-neutral-200">
          <span className="text-[11px] font-medium text-neutral-500">Attachments:</span>
          {attachments.map((att) => (
            <div
              key={att.id}
              className="inline-flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-neutral-200 shadow-2xs text-xs text-neutral-800"
            >
              {att.type.startsWith('image/') ? (
                att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded object-cover"
                  />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                )
              ) : att.name.endsWith('.js') || att.name.endsWith('.ts') || att.name.endsWith('.py') ? (
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span className="max-w-[120px] truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(att.id)}
                className="text-neutral-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
