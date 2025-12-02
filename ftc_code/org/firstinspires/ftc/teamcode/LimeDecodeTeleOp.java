package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.OpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;
import org.firstinspires.ftc.robotcore.external.navigation.YawPitchRollAngles;

@TeleOp(name = "DECODE goBILDA Mecanum - Full Control with Odometry", group = "TeleOp")
public class LimeDecodeTeleOp extends OpMode {

    private RobotHardware robot = new RobotHardware();
    private VisionSystem vision = new VisionSystem();
    private CollisionAvoidance collision = new CollisionAvoidance();
    private MecanumDrive drive;

    // Alliance selection
    private enum Alliance {
        RED, BLUE
    }
    private Alliance currentAlliance = Alliance.BLUE;
    private boolean allianceToggleLatch = false;
    private static final int BLUE_GOAL_TAG = 21;
    private static final int RED_GOAL_TAG  = 24;

    // Drive tuning & Safety
    private double strafeComp = 1.10;
    private boolean slowMode = true;
    private double slowFactor = 0.6;
    private boolean slowToggleLatch = false;

    // TILT SAFETY PARAMETERS
    private static final double SAFE_PITCH_ANGLE    = 12.0;
    private static final double WARNING_PITCH_ANGLE = 25.0;
    private static final double DANGER_PITCH_ANGLE  = 35.0;
    private static final double MIN_TILT_SCALE      = 0.10;

    // Shooter
    private double shooterSetPower = 0.85;
    private boolean shooterToggleState = false;
    private boolean shooterToggleLatch = false;

    // Vision Assist
    private boolean visionAssistEnabled = false;
    private boolean visionAssistLatch = false;
    private static final double VISION_TURN_KP = 0.02;
    private static final double VISION_MIN_TURN = 0.05;

    // Distance Threshold for LED
    private static final double DISTANCE_THRESHOLD_CM = 152.4;

    @Override
    public void init() {
        robot.init(hardwareMap, telemetry);
        vision.init(hardwareMap, telemetry);
        drive = new MecanumDrive(robot);

        // Initialize odometry
        drive.resetPose(0.0, 0.0, 0.0);

        telemetry.addLine("========================================");
        telemetry.addLine("INIT COMPLETE - Device Status:");
        telemetry.addLine("========================================");
        telemetry.addData("✓ Drive Motors", "FL0, FL1, FL2, FL3");
        telemetry.addData("✓ Intake Servos", "LS1, LS2");
        telemetry.addData("✓ Shooter Motor", "SMEH1");
        telemetry.addData("IMU (BHI260AP)", robot.imu != null ? "✓ OK" : "✗ NOT FOUND");
        telemetry.addData("Distance Sensor", robot.distanceSensor != null ? "✓ OK" : "✗ NOT FOUND");
        telemetry.addData("LED (Blinkin)", robot.ledIndicator != null ? "✓ OK" : "✗ NOT FOUND");
        telemetry.addData("Limelight 3A", vision.isLimelightOk() ? "✓ OK (USB 3.0)" : "✗ NOT FOUND");
        telemetry.addLine("========================================");
        telemetry.addLine("Ready to start!");
        telemetry.update();
    }

    @Override
    public void loop() {
        // 1) UPDATE ODOMETRY
        drive.updateOdometry();

        // 2) TILT SAFETY
        double pitch = 0.0;
        double roll = 0.0;
        double heading = 0.0;
        boolean imuOk = (robot.imu != null);

        if (imuOk) {
            try {
                YawPitchRollAngles orientation = robot.imu.getRobotYawPitchRollAngles();
                heading = orientation.getYaw(AngleUnit.DEGREES);
                pitch = orientation.getPitch(AngleUnit.DEGREES) - robot.getInitialPitch();
                roll = orientation.getRoll(AngleUnit.DEGREES) - robot.getInitialRoll();
            } catch (Exception e) {
                imuOk = false;
            }
        }

        double absPitch = Math.abs(pitch);
        double tiltScale = 1.0;
        String tiltStatus = "✓ SAFE";

        if (imuOk) {
            if (absPitch >= DANGER_PITCH_ANGLE) {
                tiltScale = MIN_TILT_SCALE;
                tiltStatus = "🚨 DANGER - POWER CUT";
            } else if (absPitch > WARNING_PITCH_ANGLE) {
                tiltScale = 0.4;
                tiltStatus = "⚠️ >25° PITCH - 40% CAP";
            } else if (absPitch >= SAFE_PITCH_ANGLE) {
                double t = (absPitch - SAFE_PITCH_ANGLE) / (WARNING_PITCH_ANGLE - SAFE_PITCH_ANGLE);
                tiltScale = 1.0 - (0.60 * t);
                tiltStatus = "⚠️ CAUTION";
            }
        } else {
            tiltStatus = "⚠️ IMU N/A";
        }

        // 3) COLLISION AVOIDANCE
        collision.update(robot.distanceSensor);
        
        // Alliance Toggle
        if (gamepad1.x && !allianceToggleLatch) {
            currentAlliance = (currentAlliance == Alliance.RED) ? Alliance.BLUE : Alliance.RED;
        }
        allianceToggleLatch = gamepad1.x;
        int targetTagId = (currentAlliance == Alliance.BLUE) ? BLUE_GOAL_TAG : RED_GOAL_TAG;

        boolean robotDetected = vision.detectRobotObstacle(targetTagId);
        double collisionScale = collision.computeCollisionAvoidanceScale(robotDetected);

        // Override toggle
        if (gamepad1.back && !collision.isOverrideActive()) { // Logic check: original used latch for toggle
             // We need to implement latch logic here properly as per original
        }
        // Re-implementing latch logic correctly locally since CollisionAvoidance helper handles state but not input latching directly in the same way
        // Actually, let's just handle the latch here
        if (gamepad1.back && !collisionOverrideLatch) {
            collision.toggleOverride();
        }
        collisionOverrideLatch = gamepad1.back;


        // Vision Processing
        boolean targetDetected = false;
        double targetTx = 0.0;
        double targetTy = 0.0;
        double targetArea = 0.0;
        int detectedTagId = -1;

        if (vision.isLimelightOk()) {
            var result = vision.getLatestResult();
            if (result != null && result.isValid()) {
                var fiducials = result.getFiducialResults();
                if (fiducials != null) {
                    for (var fiducial : fiducials) {
                        if (fiducial.getFiducialId() == targetTagId) {
                            targetDetected = true;
                            detectedTagId = fiducial.getFiducialId();
                            targetTx = fiducial.getTargetXDegrees();
                            targetTy = fiducial.getTargetYDegrees();
                            targetArea = fiducial.getTargetArea();
                            break;
                        }
                    }
                }
            }
        }

        // Vision Assist Toggle
        if (gamepad1.left_bumper && !visionAssistLatch) {
            visionAssistEnabled = !visionAssistEnabled;
        }
        visionAssistLatch = gamepad1.left_bumper;

        // Navigation Toggle
        if (gamepad1.y && !navToggleLatch) {
            if (drive.getNavState() == MecanumDrive.NavState.IDLE) {
                drive.navigateToTarget(1.0, 0.5, Math.PI / 4);
            } else {
                drive.stopNavigation();
            }
        }
        navToggleLatch = gamepad1.y;

        // 4) DRIVE CONTROL
        if (drive.getNavState() == MecanumDrive.NavState.DRIVE_TO_TARGET) {
            drive.runNavigationStep();
        } else {
            // Manual Mode
            double y = -gamepad1.left_stick_y;
            double x = gamepad1.left_stick_x * strafeComp;
            double rx = gamepad1.right_stick_x;

            if (visionAssistEnabled && targetDetected && Math.abs(rx) < 0.1) {
                double turnCorrection = targetTx * VISION_TURN_KP;
                if (Math.abs(turnCorrection) > 0.01) {
                    turnCorrection = Math.signum(turnCorrection) * Math.max(Math.abs(turnCorrection), VISION_MIN_TURN);
                }
                rx = turnCorrection;
            }

            if (gamepad1.right_bumper && !slowToggleLatch) {
                slowMode = !slowMode;
            }
            slowToggleLatch = gamepad1.right_bumper;

            double speedScale = slowMode ? slowFactor : 1.0;
            double finalScale = speedScale * tiltScale;

            y *= finalScale;
            x *= finalScale;
            rx *= finalScale;

            // Calculate powers
            double[] powers = drive.calculateMecanumPowers(y, x, rx);
            
            // Apply collision avoidance
            powers = collision.applyCollisionAvoidance(powers, collisionScale, y);

            drive.driveMecanum(0, 0, 0, powers); // Use the raw powers method
        }

        // Intake
        if (gamepad2.a) {
            robot.intakeLeft.setPower(RobotHardware.INTAKE_IN_POWER);
            robot.intakeRight.setPower(RobotHardware.INTAKE_IN_POWER);
        } else if (gamepad2.b) {
            robot.intakeLeft.setPower(RobotHardware.INTAKE_OUT_POWER);
            robot.intakeRight.setPower(RobotHardware.INTAKE_OUT_POWER);
        } else {
            robot.intakeLeft.setPower(RobotHardware.INTAKE_OFF);
            robot.intakeRight.setPower(RobotHardware.INTAKE_OFF);
        }

        // Shooter
        if (gamepad2.right_bumper && !shooterToggleLatch) {
            shooterToggleState = !shooterToggleState;
        }
        shooterToggleLatch = gamepad2.right_bumper;

        if (gamepad2.right_trigger > 0.1) {
            shooterSetPower = gamepad2.right_trigger;
        }

        if (shooterToggleState) {
            robot.shooter.setPower(shooterSetPower);
        } else {
            robot.shooter.setPower(0.0);
        }

        // LED Control
        if (robot.ledIndicator != null) {
            try {
                if (collisionScale <= CollisionAvoidance.COLLISION_EMERGENCY_SCALE + 0.01) {
                    robot.ledIndicator.setPosition(RobotHardware.LED_RED_SOLID);
                } else if (collision.isWarningActive()) {
                    robot.ledIndicator.setPosition(RobotHardware.LED_ORANGE);
                } else if (targetDetected && visionAssistEnabled) {
                    robot.ledIndicator.setPosition(RobotHardware.LED_BLUE);
                } else if (!Double.isNaN(collision.getDistanceCm())) {
                    if (collision.getDistanceCm() <= DISTANCE_THRESHOLD_CM) {
                        robot.ledIndicator.setPosition(RobotHardware.LED_GREEN);
                    } else {
                        robot.ledIndicator.setPosition(RobotHardware.LED_RED_BLINK);
                    }
                } else {
                    robot.ledIndicator.setPosition(RobotHardware.LED_RED_BLINK);
                }
            } catch (Exception e) { }
        }

        // TELEMETRY
        telemetry.addLine("========== COLLISION AVOIDANCE ==========");
        telemetry.addData("🛡️ Status", collision.isOverrideActive() ? "⚠️ OVERRIDE ACTIVE" : 
            (collision.isWarningActive() ? "🚨 WARNING" : "✓ CLEAR"));
        telemetry.addData("Distance", !Double.isNaN(collision.getDistanceCm()) ? 
            String.format("%.1f cm (%.1f in)", collision.getDistanceCm(), collision.getDistanceCm() / 2.54) : "N/A");
        telemetry.addData("Approach Velocity", String.format("%.1f cm/s", collision.getApproachVelocity()));
        telemetry.addData("Robot Detected (Vision)", robotDetected ? "✓ YES" : "✗ NO");
        telemetry.addData("Collision Scale", String.format("%.0f%%", collisionScale * 100));
        
        telemetry.addLine("========== ODOMETRY ==========");
        telemetry.addData("Pose X", String.format("%.3f m", drive.getPoseX()));
        telemetry.addData("Pose Y", String.format("%.3f m", drive.getPoseY()));
        telemetry.addData("Pose θ", String.format("%.1f°", Math.toDegrees(drive.getPoseTheta())));

        telemetry.addLine("========== ROBOT STATUS ==========");
        telemetry.addData("Heading", imuOk ? String.format("%.1f°", heading) : "N/A");
        telemetry.addData("Pitch (Tilt)", imuOk ? String.format("%.1f°", pitch) : "N/A");
        telemetry.addData("🛡️ Tilt Safety", tiltStatus);

        telemetry.addLine("========== VISION ==========");
        telemetry.addData("🎯 Alliance", currentAlliance);
        telemetry.addData("Target Detected", targetDetected ? "✓ YES" : "✗ NO");
        
        telemetry.update();
    }

    @Override
    public void stop() {
        vision.stop();
        drive.stopMotors();
    }

    // Latches
    private boolean collisionOverrideLatch = false;
    private boolean navToggleLatch = false;
}
