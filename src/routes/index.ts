import { Router } from "express"
import { UserRoutes } from "./user.routes"

export class Routes {
  private router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // Health check route
    this.router.get("/health", (req, res) => {
      res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
      })
    })

    // API routes
    this.router.use("/users", new UserRoutes().getRouter())

    // Add more route modules here as they are created
    // this.router.use('/posts', new PostRoutes().getRouter());
    // this.router.use('/auth', new AuthRoutes().getRouter());
  }

  public getRouter(): Router {
    return this.router
  }
}
