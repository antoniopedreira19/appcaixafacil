import React from 'react';
import { User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import FlavioAvatar from './FlavioAvatar';

export default function ChatMessage({ message, avatarId = 'avatar1' }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <FlavioAvatar avatarId={avatarId} size="sm" />
      )}
      
      <div className={`max-w-[80%] rounded-2xl p-4 ${
        isUser 
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-sm' 
          : 'bg-slate-100 text-slate-900 rounded-tl-sm'
      }`}>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-slate prose-p:my-2 prose-ul:my-2 prose-li:my-0 prose-headings:my-2">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}