import { useState, useEffect } from 'react';
import axios from 'axios';
import { LoaderCircle, X, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type ITAgent = {
    id: number;
    name: string;
    email: string;
    is_active?: boolean;
};

type Ticket = {
    id: number;
    title: string;
    status: string;
    submitted_by: {
        name: string;
    };
};

type AssignTicketModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ticket: Ticket | null;
};

export default function AssignTicketModal({ show, onClose, onSuccess, ticket }: AssignTicketModalProps) {
    const [itAgents, setITAgents] = useState<ITAgent[]>([]);
    const [selectedITAgent, setSelectedITAgent] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredITAgents, setFilteredITAgents] = useState<ITAgent[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            // Fetch IT agents who are active
            axios.get('/api/users/agents?active_only=true')
                .then(response => {
                    setITAgents(response.data);
                    setFilteredITAgents(response.data);
                })
                .catch(error => {
                    console.error('Error fetching agents:', error);
                    setError('Failed to load agents');
                });
        }
    }, [show]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredITAgents(itAgents);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = itAgents.filter(agent =>
                agent.name.toLowerCase().includes(query) ||
                agent.email.toLowerCase().includes(query)
            );
            setFilteredITAgents(filtered);
        }
    }, [searchQuery, itAgents]);

    const fetchITAgents = () => {
        setIsLoading(true);
        setError(''); // Clear previous errors

        // Fetch IT agents (role_id = 2)
        axios.get('/api/users/agents')
            .then(response => {
                console.log('IT Agents API response:', response.data); // Debug the response

                if (!Array.isArray(response.data)) {
                    console.error('Response is not an array:', response.data);
                    setError('Invalid response format from server');
                    return;
                }

                if (response.data.length === 0) {
                    setError('No IT Agents found in the system');
                    return;
                }

                // Make sure we're properly handling the response data structure
                const formattedAgents = response.data.map(agent => ({
                    id: agent.id,
                    name: agent.name || 'Unknown Name',
                    email: agent.email || 'No Email'
                }));

                setITAgents(formattedAgents);
                setFilteredITAgents(formattedAgents);
            })
            .catch(error => {
                console.error('Error fetching IT Agents:', error);

                // Provide more detailed error information
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                    setError(`Failed to load IT Agents (${error.response.status})`);
                } else {
                    setError('Failed to connect to server');
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedITAgent) {
            setError('Please select an IT Agent to assign this ticket');
            return;
        }

        setIsSubmitting(true);
        setError('');

        axios.post(`/api/tickets/${ticket?.id}/assign`, { agent_id: selectedITAgent })
            .then(() => {
                onSuccess();
                onClose();
                setSelectedITAgent(null);
            })
            .catch(error => {
                console.error('Error assigning ticket:', error);
                setError('Failed to assign ticket. Please try again.');
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    if (!show || !ticket) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Assign Ticket to IT Agent</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <p className="font-semibold text-gray-900 mb-1">Ticket: {ticket.title}</p>
                    <p className="text-sm text-gray-600">Submitted by: {ticket.submitted_by.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="agent" className="block text-sm font-semibold text-gray-700 mb-3">
                            Select an IT Agent
                        </Label>

                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Search IT Agents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="flex items-center gap-3">
                                    <LoaderCircle className="h-6 w-6 animate-spin text-blue-500" />
                                    <span className="text-gray-600">Loading IT Agents...</span>
                                </div>
                            </div>
                        ) : filteredITAgents.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center">
                                    <User className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">
                                    {searchQuery ? 'No agents match your search' : 'No IT Agents available'}
                                </p>
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                {filteredITAgents.map((agent, index) => (
                                    <div
                                        key={agent.id}
                                        className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                                            index !== filteredITAgents.length - 1 ? 'border-b border-gray-100' : ''
                                        } ${selectedITAgent === agent.id ? 'bg-blue-50 border-blue-200' : ''} ${
                                            agent.is_active === false ? 'opacity-60' : ''
                                        }`}
                                        onClick={() => agent.is_active !== false && setSelectedITAgent(agent.id)}
                                    >
                                        <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${
                                            agent.is_active === false
                                                ? 'from-gray-400 to-gray-500'
                                                : 'from-indigo-500 to-indigo-600'
                                        } flex items-center justify-center mr-4 shadow-lg ${
                                            selectedITAgent === agent.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                        }`}>
                                            <User className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-gray-900">{agent.name}</p>
                                                {agent.is_active === false && (
                                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{agent.email}</p>
                                        </div>
                                        <div className={`flex items-center justify-center h-6 w-6 rounded-full border-2 transition-all duration-200 ${
                                            selectedITAgent === agent.id
                                                ? 'border-blue-500 bg-blue-500'
                                                : agent.is_active === false
                                                ? 'border-gray-300 bg-gray-100'
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedITAgent === agent.id && agent.is_active !== false && (
                                                <div className="h-2 w-2 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                            disabled={isSubmitting || !selectedITAgent}
                        >
                            {isSubmitting && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
                            {isSubmitting ? 'Assigning...' : 'Assign Ticket'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
