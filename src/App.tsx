import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Define types for repository and event data
interface Repository {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
}

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  payload: {
    commits?: Array<{ sha: string; message: string }>;
  };
}

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [commitCounts, setCommitCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchData = async () => {
    if (!username) return;
    setLoading(true);
    try {
      // Fetch user profile
      const userResponse = await fetch(`https://api.github.com/users/${username}`);
      if (!userResponse.ok) {
        throw new Error('User not found');
      }
      const userData = await userResponse.json();
      setUserProfile(userData);

      // Fetch public repositories
      const repoResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
      const repoData: Repository[] = await repoResponse.json();
      setRepos(repoData);

      // Fetch public events (last 90 days)
      const eventsResponse = await fetch(`https://api.github.com/users/${username}/events`);
      const eventsData: GitHubEvent[] = await eventsResponse.json();

      // Filter push events and aggregate commit counts per day
      const counts: Record<string, number> = {};
      eventsData.forEach(event => {
        if (event.type === 'PushEvent' && event.payload.commits) {
          // Extract day from the event creation timestamp (e.g., YYYY-MM-DD)
          const day = new Date(event.created_at).toISOString().slice(0, 10);
          counts[day] = (counts[day] || 0) + event.payload.commits.length;
        }
      });
      setCommitCounts(counts);
    } catch (error) {
      console.error('Error fetching GitHub data', error);
      setUserProfile(null);
      setRepos([]);
      setCommitCounts({});
    }
    setLoading(false);
  };

  // Handle Enter key press in the input field
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            GitHub Profile Analyzer
          </h1>
          <p className="text-slate-300">Discover insights from any GitHub profile</p>
        </div>
        
        {/* Search Card */}
        <Card className="mb-8 overflow-hidden border-none bg-slate-800/50 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter GitHub username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
              <Button 
                onClick={fetchData} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20"
              >
                {loading ? 
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </div> 
                  : 'Analyze Profile'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {userProfile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 animate-fadeIn">
            {/* User Profile Card */}
            <Card className="bg-slate-800/50 border-none shadow-xl overflow-hidden">
              <div className="flex flex-col items-center p-6">
                <img 
                  src={userProfile.avatar_url} 
                  alt={`${username}'s avatar`}
                  className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-xl mb-4"
                />
                <h2 className="text-xl font-bold">{userProfile.name || username}</h2>
                <a 
                  href={userProfile.html_url}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mt-1"
                >
                  @{username}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                
                {userProfile.bio && (
                  <p className="text-slate-300 text-center mt-3">{userProfile.bio}</p>
                )}
                
                <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-blue-400">{userProfile.followers}</span>
                    <span className="text-slate-400 text-sm">Followers</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-blue-400">{userProfile.following}</span>
                    <span className="text-slate-400 text-sm">Following</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-blue-400">{userProfile.public_repos}</span>
                    <span className="text-slate-400 text-sm">Repos</span>
                  </div>
                </div>
              </div>
            </Card>
        
            {/* Repositories Column and Commit Activity */}
            <div className="md:col-span-2 space-y-8">
              {/* Commits Daily Chart */}
              <Card className="bg-slate-800/50 border-none shadow-xl">
                <CardHeader>
                  <h3 className="text-xl font-bold text-slate-200">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Commit Activity
                    </div>
                  </h3>
                </CardHeader>
                <CardContent>
                  {Object.keys(commitCounts).length ? (
                    <div className="flex space-x-1 items-end h-48 border-t border-slate-700 p-2 overflow-x-auto">
                      {Object.entries(commitCounts)
                        .sort(([dayA], [dayB]) => (dayA > dayB ? 1 : -1))
                        .map(([day, count]) => (
                          <div key={day} className="flex flex-col items-center min-w-[20px] group">
                            <div
                              className="w-5 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-300 group-hover:from-blue-500 group-hover:to-purple-400"
                              style={{ height: `${Math.min(count * 10, 150)}px` }}
                              title={`${day}: ${count} commits`}
                            />
                            <span className="text-[10px] text-slate-400 mt-1 rotate-45 origin-left">{day.slice(5)}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 bg-slate-900/30 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" />
                      </svg>
                      <p className="text-slate-400">No commit activity data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Repositories List */}
              <Card className="bg-slate-800/50 border-none shadow-xl">
                <CardHeader>
                  <h3 className="text-xl font-bold text-slate-200">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Top Repositories
                    </div>
                  </h3>
                </CardHeader>
                <CardContent>
                  {repos.length ? (
                    <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                      {repos.slice(0, 10).map(repo => (
                        <a 
                          href={repo.html_url} 
                          key={repo.id} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block bg-slate-700/40 p-4 rounded-lg transition-all duration-200 hover:bg-slate-700/70 border border-slate-700 hover:border-blue-500/50"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-blue-400">{repo.name}</h4>
                            <div className="flex items-center text-xs text-yellow-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {repo.stargazers_count}
                            </div>
                          </div>
                          
                          {repo.description && (
                            <p className="text-sm text-slate-300 mt-2 line-clamp-2">{repo.description}</p>
                          )}
                          
                          <div className="flex items-center mt-3 text-xs text-slate-400">
                            {repo.language && (
                              <div className="flex items-center mr-4">
                                <span className={`w-3 h-3 rounded-full mr-1 bg-${getLanguageColor(repo.language)}`}></span>
                                {repo.language}
                              </div>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 bg-slate-900/30 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <p className="text-slate-400">No repositories found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className="text-center mt-12 text-slate-400 text-sm">
          <p>Built with React • Powered by GitHub API • {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

// Helper function to get language color
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: 'yellow-500',
    TypeScript: 'blue-500',
    Python: 'green-500',
    Java: 'orange-600',
    'C#': 'purple-500',
    PHP: 'indigo-400',
    Ruby: 'red-500',
    Go: 'sky-500',
    Rust: 'orange-700',
    Dart: 'teal-500',
    Swift: 'orange-500',
    Kotlin: 'purple-600',
    // Add more language colors as needed
  };
  
  return colors[language] || 'gray-500';
}

export default App;
