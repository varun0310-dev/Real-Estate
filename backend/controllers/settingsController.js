const SiteSetting = require('../models/SiteSetting');
const fs = require('fs');
const path = require('path');

// GET /api/settings/logo — public, no auth required
const getLogo = async (req, res) => {
    try {
        const setting = await SiteSetting.findOne({ key: 'siteLogo' });
        if (setting) {
            return res.json({ logoUrl: setting.value });
        }
        return res.json({ logoUrl: null });
    } catch (err) {
        console.error('Error fetching logo setting:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/settings/logo — upload a new logo (auth + superadmin only)
const uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const logoPath = `/uploads/${req.file.filename}`;

        // Delete old logo file if it exists
        const existing = await SiteSetting.findOne({ key: 'siteLogo' });
        if (existing && existing.value) {
            const oldFilePath = path.join(__dirname, '..', existing.value);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Upsert the setting
        await SiteSetting.findOneAndUpdate(
            { key: 'siteLogo' },
            { key: 'siteLogo', value: logoPath },
            { upsert: true, new: true }
        );

        res.json({ message: 'Logo uploaded successfully', logoUrl: logoPath });
    } catch (err) {
        console.error('Error uploading logo:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/settings/logo — remove custom logo, revert to default
const deleteLogo = async (req, res) => {
    try {
        const existing = await SiteSetting.findOne({ key: 'siteLogo' });
        if (existing && existing.value) {
            const filePath = path.join(__dirname, '..', existing.value);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await SiteSetting.deleteOne({ key: 'siteLogo' });
        }
        res.json({ message: 'Logo removed, default will be used' });
    } catch (err) {
        console.error('Error deleting logo:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getLogo, uploadLogo, deleteLogo };
