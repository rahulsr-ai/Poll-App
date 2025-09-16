// Mobile-First Empty State Component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    {/* Simple illustration for mobile, enhanced for desktop */}
    <div className="relative mb-6">
      <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
        <div className="text-3xl sm:text-5xl">📊</div>
      </div>

      {/* Floating elements - only show on larger screens */}
      <div className="hidden sm:block absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce shadow-md flex items-center justify-center text-xs">
        ✨
      </div>
    </div>

    {/* Content */}
    <div className="text-center max-w-sm sm:max-w-md lg:max-w-lg">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
        No Polls Yet!
      </h2>

      <p className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
        Create your first poll and start collecting opinions!"
      </p>

      {/* Action buttons - stack on mobile, side by side on larger screens */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <>
          <a
            href="/create-poll"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            🚀 Create Poll
          </a>

          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-500 transition-all duration-300"
          >
            🔄 Refresh
          </button>
        </>

        <>
          <a
            href="/register"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            🎯 Get Started
          </a>

          <a
            href="/login"
            className="w-full sm:w-auto px-4 py-3 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300"
          >
            🔑 Sign In
          </a>
        </>
      </div>
    </div>
  </div>
);

export default EmptyState;
