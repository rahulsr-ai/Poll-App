import { useState, useEffect } from "react";
import useSocket from "../hooks/useSocket.js";

const Home = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [votingLoading, setVotingLoading] = useState({});
  const [votedPolls, setVotedPolls] = useState(new Set());
  const [userVotedOptions, setUserVotedOptions] = useState({});
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    isConnected,
    joinAllPolls,
    castVote,
    onPollUpdated,
    onVoteSuccess,
    onVoteError,
    socket,
  } = useSocket();

  // FIXED: Clear all voting data when user changes
  const clearVotingData = () => {
  
    setVotedPolls(new Set());
    setUserVotedOptions({});
    setSelectedOptions({});
  };

  // User authentication check
  useEffect(() => {
   
    const savedUser = localStorage.getItem("user");
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
       
        
        if (parsedUser?.id) {
          // Check if this is a different user
          if (user && user.id !== parsedUser.id) {
          
            clearVotingData();
          }
          
          setUser(parsedUser);
          setIsAuthenticated(true);
          
        }
      } catch (error) {
        console.error("❌ Error parsing user from localStorage:", error);
        localStorage.removeItem("user");
        clearVotingData();
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
     
      // User logged out, clear all voting data
      clearVotingData();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // FIXED: Load user-specific voting history ONLY when user is properly set
  useEffect(() => {
    if (user?.id && isAuthenticated) {
    
      
      // Load this user's voted polls
      const userVotesKey = `userVotes_${user.id}`;
      const userVotes = JSON.parse(localStorage.getItem(userVotesKey) || "[]");
      
      
      // Load this user's voted options
      const userVotedOptionsKey = `userVotedOptions_${user.id}`;
      const votedOptionsMap = JSON.parse(localStorage.getItem(userVotedOptionsKey) || "{}");
      

      // VALIDATE: Only use data that belongs to this user's polls
      const validVotedPolls = userVotes.filter(pollId => 
        polls.some(poll => poll.id === pollId)
      );
      
      const validVotedOptions = {};
      Object.keys(votedOptionsMap).forEach(pollId => {
        const pollIdNum = parseInt(pollId);
        if (validVotedPolls.includes(pollIdNum)) {
          validVotedOptions[pollIdNum] = votedOptionsMap[pollId];
        }
      });
      
      // Set user-specific voting data
      setVotedPolls(new Set(validVotedPolls));
      setUserVotedOptions(validVotedOptions);
      setSelectedOptions(validVotedOptions);
      
     
      
    } else if (!user) {
      // No user logged in, clear everything
     
      clearVotingData();
    }
  }, [user?.id, isAuthenticated, polls]); // Added polls dependency

  // Socket events setup
  useEffect(() => {
    if (isConnected) {
      joinAllPolls();

      const handlePollUpdated = (updatedPoll) => {
       
        setPolls((prevPolls) =>
          prevPolls.map((poll) =>
            poll.id === updatedPoll.id ? updatedPoll : poll
          )
        );
      };

      const handleVoteSuccess = (data) => {
       
        setVotingLoading((prev) => ({ ...prev, [data.pollId]: false }));

        // FIXED: Only update if this is the current user's vote
        if (user?.id && data.vote?.userId === user.id) {
          const newVotedPolls = new Set([...votedPolls, data.pollId]);
          setVotedPolls(newVotedPolls);

          const votedOptionId = selectedOptions[data.pollId];
          const newUserVotedOptions = {
            ...userVotedOptions,
            [data.pollId]: votedOptionId
          };
          setUserVotedOptions(newUserVotedOptions);

          // Save to user-specific localStorage
          const userVotesKey = `userVotes_${user.id}`;
          const userVotedOptionsKey = `userVotedOptions_${user.id}`;
          
          localStorage.setItem(userVotesKey, JSON.stringify([...newVotedPolls]));
          localStorage.setItem(userVotedOptionsKey, JSON.stringify(newUserVotedOptions));
          
          
        }

      };

      const handleVoteError = (data) => {
        
        setVotingLoading((prev) => ({ ...prev, [data.pollId]: false }));
        alert(data.message || "Error submitting vote");
      };

      onPollUpdated(handlePollUpdated);
      onVoteSuccess(handleVoteSuccess);
      onVoteError(handleVoteError);

      return () => {
        if (socket) {
          socket.off("pollUpdated", handlePollUpdated);
          socket.off("voteSuccess", handleVoteSuccess);
          socket.off("voteError", handleVoteError);
        }
      };
    }
  }, [isConnected, user?.id, votedPolls, userVotedOptions, selectedOptions, socket]);

  // Fetch polls - refetch when user changes
  const fetchPolls = async () => {
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/polls", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setPolls(data);
    } catch (error) {
      console.error("❌ Error fetching polls:", error);
      alert("Failed to load polls. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [user?.id]); // Refetch when user changes

  // Manual refresh
  const handleRefresh = () => {
  
    fetchPolls();
  };

  // Option select handler
  const handleOptionSelect = (pollId, optionId) => {
   

    if (!isAuthenticated) {
      alert("Please login to vote!");
      return;
    }

    if (votedPolls.has(pollId)) {
      alert("You have already voted on this poll!");
      return;
    }

    setSelectedOptions((prev) => ({
      ...prev,
      [pollId]: optionId,
    }));
  };

  // Submit vote through Socket.IO
  const submitVote = (pollId) => {
   

    if (!isAuthenticated || !user?.id) {
      alert("Please login to vote!");
      return;
    }

    if (!selectedOptions[pollId]) {
      alert("Please select an option first!");
      return;
    }

    if (!isConnected) {
      alert("Not connected to server! Please refresh the page.");
      return;
    }

    if (votedPolls.has(pollId)) {
      alert("You have already voted on this poll!");
      return;
    }

   
    setVotingLoading((prev) => ({ ...prev, [pollId]: true }));

    castVote(pollId, selectedOptions[pollId], user.id);
  };

  // FIXED: Add server-side vote check for current user
  // const checkServerVoteStatus = async (pollId) => {
  //   if (!user?.id) return false;
    
  //   try {
  //     const response = await fetch(`http://localhost:5000/api/polls/${pollId}/user/${user.id}/vote-status`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       return data.hasVoted;
  //     }
  //   } catch (error) {
  //     console.log("Could not check server vote status:", error);
  //   }
  //   return false;
  // };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading polls...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
            <p className="text-gray-600 mt-2">Vote and see real-time results!</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            >
              🔄 Refresh
            </button>
            
            <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-2 shadow-sm border">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? "🔄 Live" : "❌ Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* User status with user-specific info */}
        {isAuthenticated && user && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              Welcome back, <strong>{user.name || `User ${user.id}`}</strong>!
              {votedPolls.size > 0 && (
                <span className="block text-sm mt-1">
                  You've voted on {votedPolls.size} poll{votedPolls.size !== 1 ? 's' : ''} from this account
                </span>
              )}
            </p>
           
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              <a href="/login" className="text-blue-600 font-semibold hover:underline">
                Login
              </a>{" "}
              to vote and track your personal voting history!
            </p>
          </div>
        )}
      </div>

      {/* Polls List */}
      <div className="space-y-6">
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No polls available yet</h3>
            <p className="text-gray-600 mb-6">Be the first to create an engaging poll!</p>
            <a
              href="/create-poll"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🚀 Create First Poll
            </a>
          </div>
        ) : (
          polls.map((poll) => {
            // Check voting status for current user only
            const hasVoted = votedPolls.has(poll.id);
            const selectedOption = selectedOptions[poll.id];
            const userVotedOptionId = userVotedOptions[poll.id];
            const isVoting = votingLoading[poll.id];
            const totalVotes = poll.totalVotes || poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;

            return (
              <div key={poll.id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
                {/* Poll Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                  <div className="flex-1 mb-3 sm:mb-0">
                    <h3 className="text-xl font-bold mb-2">{poll.question}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>Poll #{poll.id} • Total Votes: <span className="font-semibold">{totalVotes}</span></div>
                      {hasVoted && (
                        <div className="text-green-600 font-medium">
                          ✅ You voted on this poll {user?.id && `(User ${user.id})`}
                        </div>
                      )}
                      {poll.createdAt && (
                        <div>Created: {new Date(poll.createdAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isConnected && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        🔄 Live
                      </span>
                    )}
                    {hasVoted && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        ✅ Voted
                      </span>
                    )}
                  </div>
                </div>

                {/* Poll Options */}
                <div className="space-y-3 mb-4">
                  {poll.options?.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isUserVotedOption = hasVoted && userVotedOptionId === option.id;
                    const voteCount = option.votes || 0;
                    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                    return (
                      <div key={option.id} className="relative">
                        <button
                          onClick={() => !hasVoted && handleOptionSelect(poll.id, option.id)}
                          disabled={hasVoted || isVoting || !isAuthenticated}
                          className={`w-full p-4 text-left border rounded-lg transition-all duration-200 ${
                            hasVoted
                              ? isUserVotedOption
                                ? "bg-green-50 border-green-300 ring-2 ring-green-200"
                                : "bg-gray-50 border-gray-200"
                              : isSelected
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                              : isAuthenticated
                              ? "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                              : "border-gray-200 bg-gray-100 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center flex-1">
                              {/* Vote indicator */}
                              {hasVoted ? (
                                isUserVotedOption && (
                                  <div className="w-5 h-5 rounded-full bg-green-500 mr-3 flex items-center justify-center">
                                    <div className="text-white text-xs">✓</div>
                                  </div>
                                )
                              ) : isAuthenticated ? (
                                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                  isSelected ? "border-blue-500 bg-blue-500" : "border-gray-400"
                                }`}>
                                  {isSelected && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                </div>
                              ) : null}
                              
                              <div className="flex-1">
                                <span className={`font-medium ${
                                  isUserVotedOption 
                                    ? "text-green-800" 
                                    : isSelected 
                                      ? "text-blue-800" 
                                      : "text-gray-700"
                                }`}>
                                  {option.text}
                                  {isUserVotedOption && (
                                    <span className="ml-2 text-green-600 font-bold text-sm">
                                      (Your Choice)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Vote stats */}
                            <div className="flex items-center space-x-3 text-sm">
                              <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                {voteCount} vote{voteCount !== 1 ? 's' : ''}
                              </span>
                              {totalVotes > 0 && (
                                <span className="font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                  {percentage}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          {(hasVoted || totalVotes > 0) && (
                            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                                  isUserVotedOption 
                                    ? "bg-gradient-to-r from-green-500 to-green-600" 
                                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-600">
                    <div className="font-semibold">📊 Summary</div>
                    <div>{totalVotes} total votes • Poll #{poll.id}</div>
                    {poll.creator && <div className="text-xs">By: {poll.creator.name || 'Anonymous'}</div>}
                  </div>

                  <div className="flex items-center space-x-2">
                    {!hasVoted && isAuthenticated && (
                      <button
                        onClick={() => submitVote(poll.id)}
                        disabled={!selectedOption || isVoting || !isConnected}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          selectedOption && !isVoting && isConnected
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {isVoting ? (
                          <div className="flex items-center">
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Voting...
                          </div>
                        ) : !isConnected ? (
                          "📡 Disconnected"
                        ) : (
                          "🗳️ Submit Vote"
                        )}
                      </button>
                    )}

                    {!isAuthenticated && (
                      <a href="/login" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        🔑 Login to Vote
                      </a>
                    )}

                    {hasVoted && (
                      <div className="flex items-center space-x-2">
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          ✅ Voted as User {user?.id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;
