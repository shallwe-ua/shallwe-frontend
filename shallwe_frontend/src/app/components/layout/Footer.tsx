const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="page-shell text-foreground">
        <div className="flex flex-col items-center justify-center gap-2 py-5 text-sm md:h-16 md:flex-row md:justify-between md:py-0">
          <p>&copy; {new Date().getFullYear()} Shallwe. All rights reserved.</p>
          <div className="flex gap-5">
            <a
              href="https://github.com/orgs/shallwe-ua/repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/serhii-soldatov"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted"
            >
              LinkedIn
            </a>
            <a
              href="https://app.swaggerhub.com/apis/S3MCHANNEL/shallwe-api/0.6.1#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted"
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
