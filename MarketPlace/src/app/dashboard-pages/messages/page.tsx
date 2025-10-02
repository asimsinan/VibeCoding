// Seller Messages Page
// Page for sellers to view and manage messages from buyers

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { Input } from '../../../components/ui/Input/Input';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Modal } from '../../../components/ui/Modal/Modal';
import {
  MagnifyingGlassIcon,
  EnvelopeOpenIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'RESPONDED' | 'ARCHIVED';
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    title: string;
    images: string[];
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function SellerMessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_tokens');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const parsedToken = JSON.parse(token);
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      if (filterStatus !== 'ALL') {
        params.append('status', filterStatus);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/seller/messages?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${parsedToken.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatus, searchQuery, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMessages();
    }
  }, [fetchMessages, isAuthenticated, user]);

  const getStatusVariant = (status: ContactMessage['status']) => {
    switch (status) {
      case 'UNREAD':
        return 'warning';
      case 'READ':
        return 'info';
      case 'RESPONDED':
        return 'success';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessage(message);
    setResponseMessage(message.response || '');
    setIsModalOpen(true);
    if (message.status === 'UNREAD') {
      handleUpdateStatus(message.id, 'READ');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
    setResponseMessage('');
  };

  const handleUpdateStatus = async (messageId: string, newStatus: ContactMessage['status'], currentResponse?: string | null) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('auth_tokens');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const parsedToken = JSON.parse(token);
      
      const response = await fetch(`/api/contact/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${parsedToken.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, response: currentResponse }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update message status');
      }
      
      // Update local state
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { 
          ...msg, 
          status: newStatus, 
          response: currentResponse || msg.response, 
          respondedAt: newStatus === 'RESPONDED' ? new Date().toISOString() : msg.respondedAt 
        } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { 
          ...prev, 
          status: newStatus, 
          response: currentResponse || prev.response, 
          respondedAt: newStatus === 'RESPONDED' ? new Date().toISOString() : prev.respondedAt 
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedMessage) return;
    await handleUpdateStatus(selectedMessage.id, 'RESPONDED', responseMessage);
    handleCloseModal();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMessages();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">View and respond to messages from potential buyers</p>
        </div>
        <Button variant="outline" onClick={fetchMessages} disabled={isLoading}>
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
        <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto flex space-x-2">
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Search
          </Button>
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={handleFilterChange}
            className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="ALL">All Messages</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
            <option value="RESPONDED">Responded</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {isLoading && messages.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : messages.length === 0 ? (
        <Card title="No Messages Found">
          <div className="text-center py-12">
            <EnvelopeOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't received any messages from buyers yet.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                    <Badge variant={getStatusVariant(message.status)}>{message.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">From: {message.name} ({message.email})</p>
                  {message.product && (
                    <p className="text-sm text-blue-600 mb-1">About: {message.product.title}</p>
                  )}
                  <p className="text-sm text-gray-500">Received: {new Date(message.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{message.message}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="secondary" size="sm" onClick={() => handleViewDetails(message)}>
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-gray-700">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Message Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Message Details" size="lg">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Review and respond to the message from {selectedMessage?.name}.
          </p>
        </div>
        <div>
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">From:</p>
                <p className="text-gray-900">{selectedMessage.name} ({selectedMessage.email})</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Subject:</p>
                <p className="text-gray-900">{selectedMessage.subject}</p>
              </div>
              {selectedMessage.product && (
                <div>
                  <p className="text-sm font-medium text-gray-700">About Product:</p>
                  <p className="text-gray-900">{selectedMessage.product.title}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">Message:</p>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status:</p>
                <Badge variant={getStatusVariant(selectedMessage.status)}>{selectedMessage.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Received:</p>
                <p className="text-gray-900">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
              </div>

              <div className="pt-4">
                <label htmlFor="responseMessage" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Response (Optional)
                </label>
                <textarea
                  id="responseMessage"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type your response here..."
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 pt-4">
          <Button variant="outline" onClick={handleCloseModal} disabled={isUpdating}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleRespond}
            disabled={isUpdating || !selectedMessage}
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" /> Respond & Mark as Responded
          </Button>
          <Button
            variant="outline"
            onClick={() => handleUpdateStatus(selectedMessage!.id, 'READ')}
            disabled={isUpdating || !selectedMessage || selectedMessage.status === 'READ'}
          >
            <EnvelopeOpenIcon className="h-5 w-5 mr-2" /> Mark as Read
          </Button>
          <Button
            variant="outline"
            onClick={() => handleUpdateStatus(selectedMessage!.id, 'ARCHIVED')}
            disabled={isUpdating || !selectedMessage || selectedMessage.status === 'ARCHIVED'}
          >
            <ArchiveBoxIcon className="h-5 w-5 mr-2" /> Archive
          </Button>
        </div>
      </Modal>
    </div>
  );
}
