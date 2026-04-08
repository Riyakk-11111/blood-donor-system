package com.blooddonor.model;

public class BloodRequest {
    private Long requestId;
    private String patientName;
    private String bloodGroupNeeded;
    private String hospital;
    private String city;
    private int unitsRequired;
    private boolean critical;
    private String contactNumber;
    private String createdAt;

    // Getters and Setters
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getBloodGroupNeeded() { return bloodGroupNeeded; }
    public void setBloodGroupNeeded(String bloodGroupNeeded) { this.bloodGroupNeeded = bloodGroupNeeded; }
    public String getHospital() { return hospital; }
    public void setHospital(String hospital) { this.hospital = hospital; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public int getUnitsRequired() { return unitsRequired; }
    public void setUnitsRequired(int unitsRequired) { this.unitsRequired = unitsRequired; }
    public boolean isCritical() { return critical; }
    public void setCritical(boolean critical) { this.critical = critical; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
