package com.blooddonor.dao;

import com.blooddonor.model.Donor;
import org.hibernate.Session;
import org.hibernate.Transaction;
import java.util.List;

public class DonorDAO {
    
    public void saveDonor(Donor donor) {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();
            session.save(donor);
            transaction.commit();
        } catch (Exception e) {
            if (transaction != null) {
                transaction.rollback();
            }
            e.printStackTrace();
        }
    }

    public List<Donor> getAllDonors() {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.createQuery("from Donor", Donor.class).list();
        }
    }
}
