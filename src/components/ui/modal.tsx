'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
     isOpen: boolean;
     onClose: () => void;
     children: ReactNode;
     preventClose?: boolean; // ✅ Add prop to prevent closing
}

export function Modal({ isOpen, onClose, children, preventClose = false }: ModalProps) {
     useEffect(() => {
          if (isOpen) {
               document.body.style.overflow = 'hidden';
          } else {
               document.body.style.overflow = 'unset';
          }

          return () => {
               document.body.style.overflow = 'unset';
          };
     }, [isOpen]);

     useEffect(() => {
          const handleEscape = (e: KeyboardEvent) => {
               // ✅ Only allow Escape key if not prevented
               if (e.key === 'Escape' && !preventClose) {
                    onClose();
               }
          };

          if (isOpen) {
               document.addEventListener('keydown', handleEscape);
          }

          return () => {
               document.removeEventListener('keydown', handleEscape);
          };
     }, [isOpen, onClose, preventClose]);

     if (!isOpen) return null;

     // ✅ Only call onClose if not prevented
     const handleBackdropClick = () => {
          if (!preventClose) {
               onClose();
          }
     };

     return createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
               {/* Backdrop */}
               <div
                    className="fixed inset-0 bg-black opacity-50 transition-opacity"
                    onClick={handleBackdropClick}
               />

               {/* Modal Content */}
               <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6 z-10">
                    {children}
               </div>
          </div>,
          document.body
     );
}

interface ConfirmModalProps {
     isOpen: boolean;
     onClose: () => void;
     onConfirm: () => void;
     title: string;
     message: string;
     confirmText?: string;
     cancelText?: string;
     isLoading?: boolean;
}

export function ConfirmModal({
     isOpen,
     onClose,
     onConfirm,
     title,
     message,
     confirmText = 'Ya',
     cancelText = 'Batal',
     isLoading = false
}: ConfirmModalProps) {
     return (
          <Modal isOpen={isOpen} onClose={onClose}>
               <div className="text-center">
                    {/* Icon */}
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                         <svg
                              className="h-6 w-6 text-red-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                         >
                              <path
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                              />
                         </svg>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                         {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">
                         {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-center">
                         <button
                              type="button"
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                              onClick={onClose}
                              disabled={isLoading}
                         >
                              {cancelText}
                         </button>
                         <button
                              type="button"
                              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={onConfirm}
                              disabled={isLoading}
                         >
                              {isLoading ? (
                                   <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Loading...
                                   </div>
                              ) : (
                                   confirmText
                              )}
                         </button>
                    </div>
               </div>
          </Modal>
     );
}
