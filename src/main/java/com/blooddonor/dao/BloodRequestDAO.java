package com.blooddonor.dao;

import com.blooddonor.model.BloodRequest;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BloodRequestDAO {
    private String jdbcURL = "jdbc:mysql://127.0.0.1:3307/blood_donor_db?useSSL=false&serverTimezone=UTC";
    private String jdbcUsername = "root";
    private String jdbcPassword = "";

    public BloodRequestDAO() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            createTableIfNotExists();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    protected Connection getConnection() throws SQLException {
        return DriverManager.getConnection(jdbcURL, jdbcUsername, jdbcPassword);
    }
    
    private void createTableIfNotExists() {
        String query = "CREATE TABLE IF NOT EXISTS blood_requests (" +
                       "requestId BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                       "patientName VARCHAR(255), " +
                       "bloodGroupNeeded VARCHAR(10), " +
                       "hospital VARCHAR(255), " +
                       "city VARCHAR(255), " +
                       "unitsRequired INT, " +
                       "critical BOOLEAN, " +
                       "contactNumber VARCHAR(20), " +
                       "createdAt VARCHAR(255))";
        try (Connection connection = getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(query);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public void insertRequest(BloodRequest req) throws SQLException {
        String sql = "INSERT INTO blood_requests (patientName, bloodGroupNeeded, hospital, city, unitsRequired, critical, contactNumber, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql)) {
            preparedStatement.setString(1, req.getPatientName());
            preparedStatement.setString(2, req.getBloodGroupNeeded());
            preparedStatement.setString(3, req.getHospital());
            preparedStatement.setString(4, req.getCity());
            preparedStatement.setInt(5, req.getUnitsRequired());
            preparedStatement.setBoolean(6, req.isCritical());
            preparedStatement.setString(7, req.getContactNumber());
            preparedStatement.setString(8, req.getCreatedAt());
            preparedStatement.executeUpdate();
        }
    }

    public List<BloodRequest> selectAllRequests() {
        List<BloodRequest> requests = new ArrayList<>();
        String sql = "SELECT * FROM blood_requests ORDER BY requestId DESC";
        try (Connection connection = getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql);
             ResultSet rs = preparedStatement.executeQuery()) {
            while (rs.next()) {
                BloodRequest req = new BloodRequest();
                req.setRequestId(rs.getLong("requestId"));
                req.setPatientName(rs.getString("patientName"));
                req.setBloodGroupNeeded(rs.getString("bloodGroupNeeded"));
                req.setHospital(rs.getString("hospital"));
                req.setCity(rs.getString("city"));
                req.setUnitsRequired(rs.getInt("unitsRequired"));
                req.setCritical(rs.getBoolean("critical"));
                req.setContactNumber(rs.getString("contactNumber"));
                req.setCreatedAt(rs.getString("createdAt"));
                requests.add(req);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return requests;
    }
}
