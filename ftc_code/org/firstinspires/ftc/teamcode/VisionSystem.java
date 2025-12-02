package org.firstinspires.ftc.teamcode;

import com.qualcomm.hardware.limelightvision.LLResult;
import com.qualcomm.hardware.limelightvision.LLResultTypes;
import com.qualcomm.hardware.limelightvision.Limelight3A;
import com.qualcomm.robotcore.hardware.HardwareMap;
import org.firstinspires.ftc.robotcore.external.Telemetry;

import java.util.List;

public class VisionSystem {
    private Limelight3A limelight;
    private boolean limelightOk = false;

    // Limelight-based robot detection parameters
    private static final double ROBOT_DETECTION_MIN_AREA = 0.5;      // Minimum area % to consider as robot
    private static final double ROBOT_DETECTION_MAX_AREA = 15.0;     // Maximum area % (too large = not a robot)
    private static final double ROBOT_DETECTION_ANGLE = 30.0;        // Detection cone angle (degrees, ±15° from center)

    public void init(HardwareMap hardwareMap, Telemetry telemetry) {
        try {
            limelight = hardwareMap.get(Limelight3A.class, "limelight");
            limelight.pipelineSwitch(0);
            limelight.setPollRateHz(100);
            limelight.start();
            limelightOk = true;
            telemetry.addLine("✓ Limelight 3A initialized");
        } catch (Exception e) {
            telemetry.addLine("WARNING: Limelight 'limelight' not found.");
            limelightOk = false;
        }
    }

    public void stop() {
        if (limelightOk && limelight != null) {
            limelight.stop();
        }
    }

    public boolean isLimelightOk() {
        return limelightOk;
    }

    public LLResult getLatestResult() {
        if (!limelightOk || limelight == null) return null;
        return limelight.getLatestResult();
    }

    /**
     * Detects potential robot obstacles using Limelight vision
     * Looks for objects in the forward detection cone that aren't AprilTags
     * @param targetTagId The ID of the current alliance's goal tag to ignore
     * @return true if a potential robot obstacle is detected
     */
    public boolean detectRobotObstacle(int targetTagId) {
        if (!limelightOk || limelight == null) {
            return false;
        }

        try {
            LLResult result = limelight.getLatestResult();
            if (result == null || !result.isValid()) {
                return false;
            }

            // Check for color/detector results (non-AprilTag detections)
            List<LLResultTypes.ColorResult> colorResults = result.getColorResults();
            if (colorResults != null && !colorResults.isEmpty()) {
                for (LLResultTypes.ColorResult detection : colorResults) {
                    double targetArea = detection.getTargetArea();
                    double targetX = detection.getTargetXDegrees();
                    
                    // Check if detection is in forward cone and reasonable size for a robot
                    if (Math.abs(targetX) < ROBOT_DETECTION_ANGLE &&
                        targetArea >= ROBOT_DETECTION_MIN_AREA &&
                        targetArea <= ROBOT_DETECTION_MAX_AREA) {
                        return true;
                    }
                }
            }

            // Also check fiducial results for other robots with AprilTags
            List<LLResultTypes.FiducialResult> fiducials = result.getFiducialResults();
            if (fiducials != null && !fiducials.isEmpty()) {
                for (LLResultTypes.FiducialResult fiducial : fiducials) {
                    int tagId = fiducial.getFiducialId();
                    double targetX = fiducial.getTargetXDegrees();
                    double targetArea = fiducial.getTargetArea();
                    
                    // Detect robots with tags (not our target goal)
                    if (tagId != targetTagId && 
                        Math.abs(targetX) < ROBOT_DETECTION_ANGLE &&
                        targetArea >= ROBOT_DETECTION_MIN_AREA) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            // Ignore vision errors
        }

        return false;
    }

    /**
     * Detects a specific AprilTag
     * @param targetTagId The ID of the tag to look for
     * @return The FiducialResult if found, null otherwise
     */
    public LLResultTypes.FiducialResult detectAprilTag(int targetTagId) {
        if (!limelightOk || limelight == null) {
            return null;
        }

        try {
            LLResult result = limelight.getLatestResult();
            if (result == null || !result.isValid()) {
                return null;
            }

            List<LLResultTypes.FiducialResult> fiducials = result.getFiducialResults();
            if (fiducials != null && !fiducials.isEmpty()) {
                for (LLResultTypes.FiducialResult fiducial : fiducials) {
                    if (fiducial.getFiducialId() == targetTagId) {
                        return fiducial;
                    }
                }
            }
        } catch (Exception e) {
            // Ignore vision errors
        }
        return null;
    }
}
