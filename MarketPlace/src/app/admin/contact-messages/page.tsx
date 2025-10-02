'use client';

// Admin Contact Messages Page
// Page for viewing and managing contact form submissions

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Card/Card';
import { Badge } from '../../../components/ui/Badge/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'RESPONDED' | 'ARCHIVED';
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/contact?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentPage, statusFilter, searchQuery]);

  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message status');
      }

      // Refresh messages
      fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message status');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Refresh messages
      fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return 'error';
      case 'READ':
        return 'warning';
      case 'RESPONDED':
        return 'success';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
        <div className="text-sm text-gray-500">
          {pagination && `${pagination.total} total messages`}
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {/* Filters */}
      <Card title="Filters" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
              <option value="RESPONDED">Responded</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {message.subject}
                  </h3>
                  <Badge variant={getStatusVariant(message.status)}>
                    {message.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{message.name}</span> • {message.email} • {formatDate(message.createdAt)}
                </div>
                
                <p className="text-gray-700 line-clamp-2">
                  {message.message}
                </p>
                
                {message.response && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-900 mb-1">Response:</p>
                    <p className="text-sm text-blue-800">{message.response}</p>
                    {message.respondedAt && (
                      <p className="text-xs text-blue-600 mt-1">
                        Responded on {formatDate(message.respondedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMessage(message)}
                >
                  View Details
                </Button>
                
                {message.status === 'UNREAD' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateMessageStatus(message.id, 'READ')}
                  >
                    Mark Read
                  </Button>
                )}
                
                {message.status === 'READ' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMessageStatus(message.id, 'RESPONDED')}
                  >
                    Mark Responded
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMessage(message.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrev}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNext}
          >
            Next
          </Button>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedMessage.subject}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedMessage(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">From:</span> {selectedMessage.name} ({selectedMessage.email})
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date:</span> {formatDate(selectedMessage.createdAt)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span> 
                    <Badge variant={getStatusVariant(selectedMessage.status)} className="ml-2">
                      {selectedMessage.status}
                    </Badge>
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Message:</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
                
                {selectedMessage.response && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Response:</h3>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-blue-800 whitespace-pre-wrap">
                        {selectedMessage.response}
                      </p>
                      {selectedMessage.respondedAt && (
                        <p className="text-xs text-blue-600 mt-2">
                          Responded on {formatDate(selectedMessage.respondedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
