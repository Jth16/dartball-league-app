package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.hardware.limelightvision.LLResultTypes;
import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;
import org.firstinspires.ftc.robotcore.external.navigation.YawPitchRollAngles;

@Autonomous(name = "DECODE goBILDA Mecanum - Autonomous", group = "Autonomous")
public class LimeDecodeAuto extends LinearOpMode {

    private RobotHardware robot = new RobotHardware();
    private VisionSystem vision = new VisionSystem();
    private CollisionAvoidance collision = new CollisionAvoidance();
    private MecanumDrive drive;

    // Field Geometry
    private static final double SHOOTING_X = 0.0;
    private static final double SHOOTING_Y = 0.9144;
    private static final double SHOOTING_THETA = Math.PI / 2;

    private static final double RED_START1_X = 0.3048;
    private static final double RED_START1_Y = -1.8288;
    private static final double RED_START1_THETA = Math.PI / 2;

    private static final double RED_START2_X = 1.8288;
    private static final double RED_START2_Y = 0.9144;
    private static final double RED_START2_THETA = Math.PI / 2;

    private static final double BLUE_START1_X = -0.3048;
    private static final double BLUE_START1_Y = -1.8288;
    private static final double BLUE_START1_THETA = Math.PI / 2;

    private static final double BLUE_START2_X = -1.8288;
    private static final double BLUE_START2_Y = 0.9144;
    private static final double BLUE_START2_THETA = Math.PI / 2;

    private static final double RED_HUMAN_X = -1.8288;
    private static final double RED_HUMAN_Y = -1.8288;
    private static final double BLUE_HUMAN_X = 1.8288;
    private static final double BLUE_HUMAN_Y = -1.8288;

    // Vision
    private static final int BLUE_GOAL_TAG = 20;
    private static final int RED_GOAL_TAG = 24;
    private static final double VISION_TURN_KP = 0.02;
    private static final double VISION_MIN_TURN = 0.05;
    private static final double VISION_ALIGNMENT_TOLERANCE = 2.0;
    private static final double VISION_TIMEOUT_MS = 5000;

    // Shooting
    private static final double SHOOTER_POWER = 0.85;
    private static final int NUM_SHOTS = 3;
    private static final long SHOT_DELAY_MS = 1000;
    private static final long SHOOTER_SPINUP_MS = 1500;

    // Alliance Selection
    private enum Alliance {
        RED, BLUE
    }
    private Alliance selectedAlliance = Alliance.BLUE;
    private int selectedStartPosition = 1;

    // Tilt Safety
    private static final double SAFE_PITCH_ANGLE = 12.0;
    private static final double WARNING_PITCH_ANGLE = 25.0;
    private static final double DANGER_PITCH_ANGLE = 35.0;
    private static final double MIN_TILT_SCALE = 0.10;

    @Override
    public void runOpMode() throws InterruptedException {
        robot.init(hardwareMap, telemetry);
        vision.init(hardwareMap, telemetry);
        drive = new MecanumDrive(robot);

        boolean allianceToggleLatch = false;
        boolean startPosToggleLatch = false;

        while (!isStarted() && !isStopRequested()) {
            if (gamepad1.x && !allianceToggleLatch) {
                selectedAlliance = (selectedAlliance == Alliance.RED) ? Alliance.BLUE : Alliance.RED;
            }
            allianceToggleLatch = gamepad1.x;

            if (gamepad1.y && !startPosToggleLatch) {
                selectedStartPosition = (selectedStartPosition == 1) ? 2 : 1;
            }
            startPosToggleLatch = gamepad1.y;

            telemetry.addLine("====================================");
            telemetry.addLine("AUTONOMOUS MODE - INIT PHASE");
            telemetry.addData("🎯 Alliance (X)", selectedAlliance);
            telemetry.addData("📍 Start Pos (Y)", selectedStartPosition);
            telemetry.update();
            sleep(50);
        }

        waitForStart();

        if (isStopRequested()) return;

        try {
            setInitialPose();
            setLED(selectedAlliance == Alliance.RED ? RobotHardware.LED_RED_SOLID : RobotHardware.LED_BLUE);

            // STEP 1: Drive to shooting location
            telemetry.addLine("STEP 1: Navigating to shooting location...");
            telemetry.update();
            driveToPose(SHOOTING_X, SHOOTING_Y, SHOOTING_THETA);

            if (!opModeIsActive()) return;

            // STEP 2: Align to goal
            telemetry.addLine("STEP 2: Aligning to goal...");
            telemetry.update();
            boolean visionSuccess = alignToGoalWithVision();

            if (!opModeIsActive()) return;

            // STEP 3: Shoot
            if (visionSuccess) {
                telemetry.addLine("STEP 3: Shooting...");
                telemetry.update();
                shootNDiscs(NUM_SHOTS);
            } else {
                telemetry.addLine("✗ Vision failed - skipping shooting");
                telemetry.update();
            }

            if (!opModeIsActive()) return;

            // STEP 4: Park
            telemetry.addLine("STEP 4: Parking...");
            telemetry.update();
            double humanX = (selectedAlliance == Alliance.RED) ? RED_HUMAN_X : BLUE_HUMAN_X;
            double humanY = (selectedAlliance == Alliance.RED) ? RED_HUMAN_Y : BLUE_HUMAN_Y;
            driveToPose(humanX, humanY, SHOOTING_THETA);

            setLED(RobotHardware.LED_GREEN);
            telemetry.addLine("AUTONOMOUS COMPLETE!");
            telemetry.update();

        } catch (Exception e) {
            telemetry.addData("ERROR", e.getMessage());
            telemetry.update();
        } finally {
            drive.stopMotors();
            robot.shooter.setPower(0);
            robot.intakeLeft.setPower(0);
            robot.intakeRight.setPower(0);
            vision.stop();
        }
        
        while (opModeIsActive()) { sleep(100); }
    }

    private void setInitialPose() {
        if (selectedAlliance == Alliance.RED) {
            if (selectedStartPosition == 1) drive.resetPose(RED_START1_X, RED_START1_Y, RED_START1_THETA);
            else drive.resetPose(RED_START2_X, RED_START2_Y, RED_START2_THETA);
        } else {
            if (selectedStartPosition == 1) drive.resetPose(BLUE_START1_X, BLUE_START1_Y, BLUE_START1_THETA);
            else drive.resetPose(BLUE_START2_X, BLUE_START2_Y, BLUE_START2_THETA);
        }
    }

    private void driveToPose(double targetX, double targetY, double targetTheta) {
        drive.navigateToTarget(targetX, targetY, targetTheta);
        
        while (opModeIsActive()) {
            drive.updateOdometry();
            collision.update(robot.distanceSensor);

            if (drive.getNavState() == MecanumDrive.NavState.DONE) {
                break;
            }
            
            // Check manual arrival condition since MecanumDrive.runNavigationStep() handles loop logic but we need to inject safety
            // Actually, MecanumDrive.runNavigationStep() does the driving. We should use it but we need to intercept the powers.
            // But MecanumDrive is designed for TeleOp loop.
            // Let's reimplement the loop here using drive.calculateMecanumPowers()
            
            double errorX = targetX - drive.getPoseX();
            double errorY = targetY - drive.getPoseY();
            // We need normalizeAngle from somewhere. It's private in MecanumDrive.
            // Let's just use a local helper or make it public. For now, local helper.
            double errorTheta = normalizeAngle(targetTheta - drive.getPoseTheta());
            double distanceErr = Math.sqrt(errorX * errorX + errorY * errorY);

            if (distanceErr < 0.20 && Math.abs(errorTheta) < 0.1) { // Tolerances
                drive.stopMotors();
                break;
            }

            // Safety Scales
            double tiltScale = getTiltSafetyScale();
            double collisionScale = collision.computeCollisionAvoidanceScale(false); // No robot detection in auto for now
            double safetyScale = Math.min(tiltScale, collisionScale);

            // Calculate Powers (simplified PID from TeleOp/Auto)
            double vX_field = 1.0 * errorX;
            double vY_field = 1.0 * errorY;
            double vTheta = 2.0 * errorTheta;

            double cos_theta = Math.cos(drive.getPoseTheta());
            double sin_theta = Math.sin(drive.getPoseTheta());
            
            double vX_body = vX_field * cos_theta + vY_field * sin_theta;
            double vY_body = -vX_field * sin_theta + vY_field * cos_theta;

            // Limits
            vX_body = clamp(vX_body, -0.5, 0.5);
            vY_body = clamp(vY_body, -0.5, 0.5);
            vTheta = clamp(vTheta, -0.5, 0.5);

            // Creep
            if (distanceErr < 0.3) {
                if (Math.abs(vX_body) > 0.01 && Math.abs(vX_body) < 0.1) vX_body = Math.signum(vX_body) * 0.1;
                if (Math.abs(vY_body) > 0.01 && Math.abs(vY_body) < 0.1) vY_body = Math.signum(vY_body) * 0.1;
            }

            vX_body *= safetyScale;
            vY_body *= safetyScale;
            vTheta *= safetyScale;

            drive.driveMecanum(vX_body, vY_body, vTheta);
            
            telemetry.addData("Target", String.format("(%.2f, %.2f)", targetX, targetY));
            telemetry.addData("Pose", String.format("(%.2f, %.2f)", drive.getPoseX(), drive.getPoseY()));
            telemetry.update();
        }
        drive.stopMotors();
    }

    private boolean alignToGoalWithVision() {
        if (!vision.isLimelightOk()) return false;
        int targetTagId = (selectedAlliance == Alliance.RED) ? RED_GOAL_TAG : BLUE_GOAL_TAG;
        long startTime = System.currentTimeMillis();

        while (opModeIsActive()) {
            if (System.currentTimeMillis() - startTime > VISION_TIMEOUT_MS) return false;

            drive.updateOdometry();
            LLResultTypes.FiducialResult tag = vision.detectAprilTag(targetTagId);

            if (tag == null) {
                sleep(50);
                continue;
            }

            double targetTx = tag.getTargetXDegrees();
            if (Math.abs(targetTx) < VISION_ALIGNMENT_TOLERANCE) {
                drive.stopMotors();
                return true;
            }

            double turnPower = targetTx * VISION_TURN_KP;
            if (Math.abs(turnPower) > 0.01) {
                turnPower = Math.signum(turnPower) * Math.max(Math.abs(turnPower), VISION_MIN_TURN);
            }
            turnPower = clamp(turnPower, -0.5, 0.5);
            
            drive.driveMecanum(0, 0, turnPower);
            sleep(20);
        }
        return false;
    }

    private void shootNDiscs(int numShots) {
        robot.shooter.setPower(SHOOTER_POWER);
        sleep(SHOOTER_SPINUP_MS);

        for (int i = 0; i < numShots && opModeIsActive(); i++) {
            robot.intakeLeft.setPower(1.0);
            robot.intakeRight.setPower(1.0);
            sleep(300);
            robot.intakeLeft.setPower(0);
            robot.intakeRight.setPower(0);
            if (i < numShots - 1) sleep(SHOT_DELAY_MS);
        }
        robot.shooter.setPower(0);
    }

    private double getTiltSafetyScale() {
        if (robot.imu == null) return 1.0;
        try {
            YawPitchRollAngles orientation = robot.imu.getRobotYawPitchRollAngles();
            double pitch = Math.abs(orientation.getPitch(AngleUnit.DEGREES) - robot.getInitialPitch());
            if (pitch >= DANGER_PITCH_ANGLE) return MIN_TILT_SCALE;
            if (pitch > WARNING_PITCH_ANGLE) return 0.4;
            if (pitch >= SAFE_PITCH_ANGLE) {
                double t = (pitch - SAFE_PITCH_ANGLE) / (WARNING_PITCH_ANGLE - SAFE_PITCH_ANGLE);
                return 1.0 - (0.60 * t);
            }
        } catch (Exception e) {}
        return 1.0;
    }

    private void setLED(double pattern) {
        if (robot.ledIndicator != null) robot.ledIndicator.setPosition(pattern);
    }

    private double normalizeAngle(double angle) {
        while (angle > Math.PI) angle -= 2.0 * Math.PI;
        while (angle < -Math.PI) angle += 2.0 * Math.PI;
        return angle;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
