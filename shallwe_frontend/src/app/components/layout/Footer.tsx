const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <p className="text-center md:text-left text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Shallwe. All rights reserved.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex justify-center space-x-6 md:order-2">
            <a
              href="https://github.com/orgs/shallwe-ua/repositories"
              target="_blank"
              rel="noopener noreferrer" // Recommended for security when using target="_blank"
              className="text-gray-400 hover:text-gray-500"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/serhii-soldatov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-500"
            >
              LinkedIn
            </a>
            <a
              href="https://app.swaggerhub.com/apis/S3MCHANNEL/shallwe-api/0.6.1#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-500"
            >
              API Reference
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
