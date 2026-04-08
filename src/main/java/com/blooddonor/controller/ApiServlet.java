package com.blooddonor.controller;

import com.blooddonor.dao.BloodRequestDAO;
import com.blooddonor.dao.DonorDAO;
import com.blooddonor.model.BloodRequest;
import com.blooddonor.model.Donor;
import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import java.util.List;

@WebServlet("/api/*")
public class ApiServlet extends HttpServlet {
    private DonorDAO donorDAO;
    private BloodRequestDAO requestDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        donorDAO = new DonorDAO();
        requestDAO = new BloodRequestDAO();
        gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        if ("/donors".equals(pathInfo)) {
            List<Donor> donors = donorDAO.getAllDonors();
            out.print(gson.toJson(donors));
        } else if ("/requests".equals(pathInfo)) {
            List<BloodRequest> requests = requestDAO.selectAllRequests();
            out.print(gson.toJson(requests));
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            out.print("{\"error\": \"Endpoint not found\"}");
        }
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        BufferedReader reader = req.getReader();
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        String jsonBody = sb.toString();

        PrintWriter out = resp.getWriter();

        if ("/donors".equals(pathInfo)) {
            Donor donor = gson.fromJson(jsonBody, Donor.class);
            donorDAO.saveDonor(donor);
            out.print(gson.toJson(donor));
        } else if ("/requests".equals(pathInfo)) {
            BloodRequest request = gson.fromJson(jsonBody, BloodRequest.class);
            request.setCreatedAt(new Date().toString());
            try {
                requestDAO.insertRequest(request);
                out.print(gson.toJson(request));
            } catch (Exception e) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\": \""+e.getMessage()+"\"}");
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            out.print("{\"error\": \"Endpoint not found\"}");
        }
        out.flush();
    }
}
