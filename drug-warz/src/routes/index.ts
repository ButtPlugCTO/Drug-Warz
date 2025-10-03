import { Router } from "express"
import candidatesRouter from "./candidates"
import launchesRouter from "./launches"
import statsRouter from "./stats"
import adminRouter from "./admin"
import treasuryRouter from "./treasury"

const router = Router()

router.use("/candidates", candidatesRouter)
router.use("/launches", launchesRouter)
router.use("/stats", statsRouter)
router.use("/admin", adminRouter)
router.use("/treasury", treasuryRouter)

export default router
