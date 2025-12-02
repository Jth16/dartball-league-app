package org.firstinspires.ftc.teamcode;

import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;
import org.firstinspires.ftc.robotcore.external.navigation.YawPitchRollAngles;

public class MecanumDrive {
    // Hardware Constants
    private static final double WHEEL_DIAMETER_MM = 93.0;
    private static final double GEAR_RATIO = 16.0;
    private static final double ENCODER_CPR = 112.0;
    private static final double TRACK_WIDTH_M = 0.305;
    private static final double WHEEL_BASE_M = 0.305;

    // Derived constants
    private static final double WHEEL_CIRCUMFERENCE_M = Math.PI * (WHEEL_DIAMETER_MM / 1000.0);
    private static final double COUNTS_PER_WHEEL_REV = ENCODER_CPR * GEAR_RATIO;
    private static final double L = WHEEL_BASE_M / 2.0;
    private static final double W = TRACK_WIDTH_M / 2.0;

    // Navigation Tuning
    private static final double POS_TOL = 0.20;
    private static final double THETA_TOL = 0.1;
    private static final double kP_forward = 1.0;
    private static final double kP_strafe = 1.0;
    private static final double kP_rotation = 2.0;
    private static final double MAX_SPEED = 0.5;
    private static final double MIN_SPEED = 0.1;
    private static final double CREEP_DISTANCE = 0.3;

    // Odometry State
    private double poseX = 0.0;
    private double poseY = 0.0;
    private double poseTheta = 0.0;

    private int lastEncFL = 0;
    private int lastEncFR = 0;
    private int lastEncRL = 0;
    private int lastEncRR = 0;

    // Navigation State
    public enum NavState {
        IDLE,
        DRIVE_TO_TARGET,
        DONE
    }
    private NavState navState = NavState.IDLE;
    private double targetX = 0.0;
    private double targetY = 0.0;
    private double targetTheta = 0.0;

    private final RobotHardware robot;

    public MecanumDrive(RobotHardware robot) {
        this.robot = robot;
    }

    public void resetPose(double x, double y, double theta) {
        poseX = x;
        poseY = y;
        poseTheta = normalizeAngle(theta);
        
        if (robot.leftFront != null) {
            lastEncFL = robot.leftFront.getCurrentPosition();
            lastEncFR = robot.rightFront.getCurrentPosition();
            lastEncRL = robot.leftRear.getCurrentPosition();
            lastEncRR = robot.rightRear.getCurrentPosition();
        }
    }

    public void updateOdometry() {
        if (robot.leftFront == null) return;

        int currentFL = robot.leftFront.getCurrentPosition();
        int currentFR = robot.rightFront.getCurrentPosition();
        int currentRL = robot.leftRear.getCurrentPosition();
        int currentRR = robot.rightRear.getCurrentPosition();

        int dFL_ticks = currentFL - lastEncFL;
        int dFR_ticks = currentFR - lastEncFR;
        int dRL_ticks = currentRL - lastEncRL;
        int dRR_ticks = currentRR - lastEncRR;

        lastEncFL = currentFL;
        lastEncFR = currentFR;
        lastEncRL = currentRL;
        lastEncRR = currentRR;

        double dFL = ticksToDistanceMeters(dFL_ticks);
        double dFR = ticksToDistanceMeters(dFR_ticks);
        double dRL = ticksToDistanceMeters(dRL_ticks);
        double dRR = ticksToDistanceMeters(dRR_ticks);

        double dx_body = 0.25 * (dFL + dFR + dRL + dRR);
        double dy_body = 0.25 * (-dFL + dFR + dRL - dRR);
        double dtheta_enc = (1.0 / (4.0 * (L + W))) * (-dFL + dFR - dRL + dRR);

        double thetaNow;
        if (robot.imu != null) {
            try {
                YawPitchRollAngles orientation = robot.imu.getRobotYawPitchRollAngles();
                thetaNow = Math.toRadians(orientation.getYaw(AngleUnit.DEGREES));
            } catch (Exception e) {
                thetaNow = poseTheta + dtheta_enc;
            }
        } else {
            thetaNow = poseTheta + dtheta_enc;
        }

        double cos_theta = Math.cos(poseTheta);
        double sin_theta = Math.sin(poseTheta);

        double dx_field = dx_body * cos_theta - dy_body * sin_theta;
        double dy_field = dx_body * sin_theta + dy_body * cos_theta;

        poseX += dx_field;
        poseY += dy_field;
        poseTheta = normalizeAngle(thetaNow);
    }

    public void navigateToTarget(double x, double y, double theta) {
        targetX = x;
        targetY = y;
        targetTheta = normalizeAngle(theta);
        navState = NavState.DRIVE_TO_TARGET;
    }

    public void stopNavigation() {
        navState = NavState.IDLE;
        stopMotors();
    }

    public void stopMotors() {
        if (robot.leftFront == null) return;
        robot.leftFront.setPower(0);
        robot.leftRear.setPower(0);
        robot.rightFront.setPower(0);
        robot.rightRear.setPower(0);
    }

    public void driveMecanum(double vX, double vY, double vTheta) {
        if (robot.leftFront == null) return;

        double wheelFL = vX - vY - vTheta;
        double wheelFR = vX + vY + vTheta;
        double wheelRL = vX + vY - vTheta;
        double wheelRR = vX - vY + vTheta;

        double maxWheel = Math.max(
            Math.max(Math.abs(wheelFL), Math.abs(wheelFR)),
            Math.max(Math.abs(wheelRL), Math.abs(wheelRR))
        );

        if (maxWheel > MAX_SPEED) {
            double scale = MAX_SPEED / maxWheel;
            wheelFL *= scale;
            wheelFR *= scale;
            wheelRL *= scale;
            wheelRR *= scale;
        }

        robot.leftFront.setPower(wheelFL);
        robot.rightFront.setPower(wheelFR);
        robot.leftRear.setPower(wheelRL);
        robot.rightRear.setPower(wheelRR);
    }

    public void driveMecanum(double vX, double vY, double vTheta, double[] powers) {
         if (robot.leftFront == null) return;
         robot.leftFront.setPower(powers[0]);
         robot.rightFront.setPower(powers[1]);
         robot.leftRear.setPower(powers[2]);
         robot.rightRear.setPower(powers[3]);
    }
    
    // Helper to calculate raw powers without setting them, useful for collision avoidance modification
    public double[] calculateMecanumPowers(double vX, double vY, double vTheta) {
        double wheelFL = vX - vY - vTheta;
        double wheelFR = vX + vY + vTheta;
        double wheelRL = vX + vY - vTheta;
        double wheelRR = vX - vY + vTheta;

        double maxWheel = Math.max(
            Math.max(Math.abs(wheelFL), Math.abs(wheelFR)),
            Math.max(Math.abs(wheelRL), Math.abs(wheelRR))
        );

        if (maxWheel > MAX_SPEED) {
            double scale = MAX_SPEED / maxWheel;
            wheelFL *= scale;
            wheelFR *= scale;
            wheelRL *= scale;
            wheelRR *= scale;
        }
        
        return new double[]{wheelFL, wheelFR, wheelRL, wheelRR};
    }

    public void runNavigationStep() {
        if (navState != NavState.DRIVE_TO_TARGET) return;

        double errorX = targetX - poseX;
        double errorY = targetY - poseY;
        double errorTheta = normalizeAngle(targetTheta - poseTheta);
        double distanceErr = Math.sqrt(errorX * errorX + errorY * errorY);

        if (distanceErr < POS_TOL && Math.abs(errorTheta) < THETA_TOL) {
            stopMotors();
            navState = NavState.DONE;
            return;
        }

        double vX_field = kP_forward * errorX;
        double vY_field = kP_strafe * errorY;
        double vTheta = kP_rotation * errorTheta;

        double cos_theta = Math.cos(poseTheta);
        double sin_theta = Math.sin(poseTheta);

        double vX_body =  vX_field * cos_theta + vY_field * sin_theta;
        double vY_body = -vX_field * sin_theta + vY_field * cos_theta;

        vX_body = clamp(vX_body, -MAX_SPEED, MAX_SPEED);
        vY_body = clamp(vY_body, -MAX_SPEED, MAX_SPEED);
        vTheta = clamp(vTheta, -MAX_SPEED, MAX_SPEED);

        if (distanceErr < CREEP_DISTANCE) {
            if (Math.abs(vX_body) > 0.01 && Math.abs(vX_body) < MIN_SPEED) vX_body = Math.signum(vX_body) * MIN_SPEED;
            if (Math.abs(vY_body) > 0.01 && Math.abs(vY_body) < MIN_SPEED) vY_body = Math.signum(vY_body) * MIN_SPEED;
            if (Math.abs(vTheta) > 0.01 && Math.abs(vTheta) < MIN_SPEED) vTheta = Math.signum(vTheta) * MIN_SPEED;
        }

        driveMecanum(vX_body, vY_body, vTheta);
    }

    private double ticksToDistanceMeters(int ticks) {
        return (ticks / COUNTS_PER_WHEEL_REV) * WHEEL_CIRCUMFERENCE_M;
    }

    private double normalizeAngle(double angle) {
        while (angle > Math.PI) angle -= 2.0 * Math.PI;
        while (angle < -Math.PI) angle += 2.0 * Math.PI;
        return angle;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    // Getters
    public double getPoseX() { return poseX; }
    public double getPoseY() { return poseY; }
    public double getPoseTheta() { return poseTheta; }
    public NavState getNavState() { return navState; }
    public double getTargetX() { return targetX; }
    public double getTargetY() { return targetY; }
    public double getTargetTheta() { return targetTheta; }
}
