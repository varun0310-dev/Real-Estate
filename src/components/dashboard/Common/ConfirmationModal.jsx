import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Delete",
    cancelText = "Cancel",
    confirmColor = "bg-red-600 hover:bg-red-700",
    icon = <FiAlertTriangle className="h-6 w-6 text-red-600" />,
    iconBg = "bg-red-100"
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center"
                >
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBg} mb-4`}>
                        {icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#1e1e2d] mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-8">
                        {message}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onCancel}
                            className="px-6 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-6 py-2 text-sm font-bold text-white ${confirmColor} rounded-lg shadow-sm transition cursor-pointer`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
