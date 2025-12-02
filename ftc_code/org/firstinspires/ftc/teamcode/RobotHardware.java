package org.firstinspires.ftc.teamcode;

import com.qualcomm.hardware.rev.RevHubOrientationOnRobot;
import com.qualcomm.robotcore.hardware.CRServo;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.hardware.DistanceSensor;
import com.qualcomm.robotcore.hardware.HardwareMap;
import com.qualcomm.robotcore.hardware.IMU;
import com.qualcomm.robotcore.hardware.Servo;
import org.firstinspires.ftc.robotcore.external.Telemetry;
import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;
import org.firstinspires.ftc.robotcore.external.navigation.YawPitchRollAngles;

public class RobotHardware {
    // Drivetrain motors
    public DcMotor leftFront;
    public DcMotor leftRear;
    public DcMotor rightFront;
    public DcMotor rightRear;

    // Intake & Shooter
    public CRServo intakeLeft;
    public CRServo intakeRight;
    public DcMotor shooter;

    // Sensors & Other
    public IMU imu;
    public DistanceSensor distanceSensor;
    public Servo ledIndicator;

    // Constants
    public static final double LED_GREEN = 0.77;
    public static final double LED_RED_BLINK = -0.25;
    public static final double LED_BLUE = 0.87;
    public static final double LED_ORANGE = 0.65;
    public static final double LED_RED_SOLID = 0.61;

    public static final double INTAKE_IN_POWER = 1.0;
    public static final double INTAKE_OUT_POWER = -1.0;
    public static final double INTAKE_OFF = 0.0;

    private double initialPitch = 0.0;
    private double initialRoll = 0.0;

    public void init(HardwareMap hardwareMap, Telemetry telemetry) {
        // Map motors
        leftFront = hardwareMap.get(DcMotor.class, "FL2");
        leftRear = hardwareMap.get(DcMotor.class, "FL3");
        rightFront = hardwareMap.get(DcMotor.class, "FL0");
        rightRear = hardwareMap.get(DcMotor.class, "FL1");

        // Intake & Shooter
        intakeLeft = hardwareMap.get(CRServo.class, "LS1");
        intakeRight = hardwareMap.get(CRServo.class, "LS2");
        shooter = hardwareMap.get(DcMotor.class, "SMEH1");

        // IMU
        try {
            imu = hardwareMap.get(IMU.class, "imu");
            IMU.Parameters imuParams = new IMU.Parameters(
                new RevHubOrientationOnRobot(
                    RevHubOrientationOnRobot.LogoFacingDirection.LEFT,
                    RevHubOrientationOnRobot.UsbFacingDirection.UP
                )
            );
            imu.initialize(imuParams);
            imu.resetYaw();
        } catch (IllegalArgumentException e) {
            telemetry.addLine("ERROR: IMU 'imu' not found!");
            imu = null;
        }

        // Distance Sensor
        try {
            distanceSensor = hardwareMap.get(DistanceSensor.class, "distance");
        } catch (IllegalArgumentException e) {
            telemetry.addLine("WARNING: Distance sensor 'distance' not found.");
        }

        // LED
        try {
            ledIndicator = hardwareMap.get(Servo.class, "led");
            ledIndicator.setPosition(LED_RED_BLINK);
        } catch (IllegalArgumentException e) {
            telemetry.addLine("WARNING: LED 'led' not found (OK if not installed yet).");
        } catch (Exception e) {
            // Safe if Blinkin not physically connected yet
        }

        // Motor directions
        leftFront.setDirection(DcMotorSimple.Direction.FORWARD);
        leftRear.setDirection(DcMotorSimple.Direction.FORWARD);
        rightFront.setDirection(DcMotorSimple.Direction.REVERSE);
        rightRear.setDirection(DcMotorSimple.Direction.FORWARD);

        // Basic motor config
        for (DcMotor m : new DcMotor[]{leftFront, leftRear, rightFront, rightRear}) {
            m.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER);
            m.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER);
            m.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
        }

        // Shooter config
        shooter.setMode(DcMotor.RunMode.RUN_WITHOUT_ENCODER);
        shooter.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.FLOAT);
        shooter.setDirection(DcMotorSimple.Direction.FORWARD);

        // Intake directions
        intakeLeft.setDirection(DcMotorSimple.Direction.FORWARD);
        intakeRight.setDirection(DcMotorSimple.Direction.REVERSE);

        // Capture IMU "startup" pitch/roll
        if (imu != null) {
            try {
                YawPitchRollAngles start = imu.getRobotYawPitchRollAngles();
                initialPitch = start.getPitch(AngleUnit.DEGREES);
                initialRoll = start.getRoll(AngleUnit.DEGREES);
            } catch (Exception e) {
                initialPitch = 0.0;
                initialRoll = 0.0;
            }
        }
    }

    public double getInitialPitch() { return initialPitch; }
    public double getInitialRoll() { return initialRoll; }
}
