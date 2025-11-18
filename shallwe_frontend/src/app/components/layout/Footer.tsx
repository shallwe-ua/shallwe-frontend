const Footer = () => {
  return (
    <footer className="border-t border-border bg-white/90 backdrop-blur">
      <div className="page-shell py-6">
        <div className="md:flex md:items-center md:justify-between gap-4">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} Shallwe. All rights reserved.
          </p>
          <div className="mt-3 md:mt-0 flex gap-5 text-sm text-muted">
            <a
              href="https://github.com/orgs/shallwe-ua/repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/serhii-soldatov"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              LinkedIn
            </a>
            <a
              href="https://app.swaggerhub.com/apis/S3MCHANNEL/shallwe-api/0.6.1#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
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
