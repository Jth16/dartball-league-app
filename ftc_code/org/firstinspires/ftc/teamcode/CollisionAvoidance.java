package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.hardware.DistanceSensor;
import org.firstinspires.ftc.robotcore.external.navigation.DistanceUnit;

public class CollisionAvoidance {
    // Distance thresholds for collision avoidance (in cm)
    private static final double COLLISION_STOP_DISTANCE = 20.0;      // Emergency stop distance (8 inches)
    private static final double COLLISION_SLOW_DISTANCE = 50.0;      // Start slowing down (20 inches)
    private static final double COLLISION_WARNING_DISTANCE = 100.0;  // Warning zone (39 inches)
    
    // Speed scaling factors for collision avoidance
    public static final double COLLISION_EMERGENCY_SCALE = 0.0;     // Full stop
    private static final double COLLISION_SLOW_SCALE = 0.3;          // 30% speed in slow zone
    private static final double COLLISION_WARNING_SCALE = 0.6;       // 60% speed in warning zone

    // Collision avoidance state tracking
    private double lastDistanceCm = Double.NaN;
    private long lastDistanceTime = 0;
    private double approachVelocity = 0.0;  // cm/s, positive = approaching
    private boolean collisionWarningActive = false;
    private boolean collisionAvoidanceOverride = false;  // Manual override with gamepad

    public void update(DistanceSensor distanceSensor) {
        // Read distance sensor
        double distanceCm = Double.NaN;
        if (distanceSensor != null) {
            try {
                distanceCm = distanceSensor.getDistance(DistanceUnit.CM);
            } catch (Exception e) {
                // Sensor read error
            }
        }

        // Calculate approach velocity
        long currentTime = System.currentTimeMillis();
        if (!Double.isNaN(distanceCm) && !Double.isNaN(lastDistanceCm)) {
            calculateApproachVelocity(distanceCm, currentTime);
        }
        lastDistanceCm = distanceCm;
        lastDistanceTime = currentTime;
    }

    /**
     * Calculates approach velocity based on distance sensor readings
     * Positive velocity = approaching obstacle
     */
    private void calculateApproachVelocity(double currentDistance, long currentTime) {
        double deltaTime = (currentTime - lastDistanceTime) / 1000.0; // Convert to seconds

        if (deltaTime < 0.01 || deltaTime > 1.0) {
            // Invalid time delta, reset
            return;
        }

        // Negative delta distance = approaching (distance decreasing)
        double deltaDistance = currentDistance - lastDistanceCm;
        double velocity = -deltaDistance / deltaTime; // Positive = approaching

        // Simple low-pass filter to smooth velocity
        approachVelocity = 0.7 * approachVelocity + 0.3 * velocity;
    }

    /**
     * Computes collision avoidance scale factor based on distance and approach velocity
     * @param robotDetected - Whether Limelight detected a robot obstacle
     * @return Scale factor (0.0 to 1.0) to apply to motor powers
     */
    public double computeCollisionAvoidanceScale(boolean robotDetected) {
        // If override is active, disable collision avoidance
        if (collisionAvoidanceOverride) {
            collisionWarningActive = false;
            return 1.0;
        }

        // If no valid distance reading, allow full speed
        if (Double.isNaN(lastDistanceCm)) {
            collisionWarningActive = false;
            return 1.0;
        }

        // Calculate dynamic threshold based on approach velocity
        // Faster approach = need more stopping distance
        double velocityFactor = Math.max(0.0, approachVelocity / 50.0); // Normalize to ~50 cm/s max
        double dynamicStopDistance = COLLISION_STOP_DISTANCE + (velocityFactor * 20.0);
        double dynamicSlowDistance = COLLISION_SLOW_DISTANCE + (velocityFactor * 30.0);

        // Emergency stop zone
        if (lastDistanceCm <= dynamicStopDistance) {
            collisionWarningActive = true;
            return COLLISION_EMERGENCY_SCALE;
        }

        // Slow zone with gradual scaling
        if (lastDistanceCm <= dynamicSlowDistance) {
            collisionWarningActive = true;
            // Linear interpolation between stop and slow distances
            double t = (lastDistanceCm - dynamicStopDistance) / (dynamicSlowDistance - dynamicStopDistance);
            return COLLISION_EMERGENCY_SCALE + t * (COLLISION_SLOW_SCALE - COLLISION_EMERGENCY_SCALE);
        }

        // Warning zone - only apply if robot detected or approaching fast
        if (lastDistanceCm <= COLLISION_WARNING_DISTANCE && (robotDetected || approachVelocity > 20.0)) {
            collisionWarningActive = true;
            // Linear interpolation between slow and warning distances
            double t = (lastDistanceCm - dynamicSlowDistance) / (COLLISION_WARNING_DISTANCE - dynamicSlowDistance);
            return COLLISION_SLOW_SCALE + t * (COLLISION_WARNING_SCALE - COLLISION_SLOW_SCALE);
        }

        // Clear zone
        collisionWarningActive = false;
        return 1.0;
    }

    /**
     * Applies collision avoidance scaling to motor powers
     * Only reduces forward motion toward obstacle, allows backward and rotation
     * @param powers - Array of motor powers [FL, FR, RL, RR]
     * @param scale - Collision avoidance scale factor
     * @param forwardComponent - Forward component of motion (positive = forward)
     * @return Scaled motor powers
     */
    public double[] applyCollisionAvoidance(double[] powers, double scale, double forwardComponent) {
        // Only apply collision avoidance if moving forward toward obstacle
        if (forwardComponent <= 0.0 || scale >= 0.99) {
            return powers;
        }

        // Calculate how much of each wheel's power is contributing to forward motion
        // For mecanum: forward motion is average of all wheels
        double avgPower = (powers[0] + powers[1] + powers[2] + powers[3]) / 4.0;
        
        // Only scale if net motion is forward
        if (avgPower > 0.0) {
            for (int i = 0; i < powers.length; i++) {
                // Preserve backward motion and rotation, only limit forward
                if (powers[i] > 0.0) {
                    powers[i] *= scale;
                }
            }
        }

        return powers;
    }

    public void toggleOverride() {
        collisionAvoidanceOverride = !collisionAvoidanceOverride;
    }

    public boolean isOverrideActive() {
        return collisionAvoidanceOverride;
    }

    public boolean isWarningActive() {
        return collisionWarningActive;
    }

    public double getDistanceCm() {
        return lastDistanceCm;
    }

    public double getApproachVelocity() {
        return approachVelocity;
    }
}
