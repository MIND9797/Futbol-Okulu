const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');
require('dotenv').config();

const server = express();
const PORT = process.env.PORT || 3000;

server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'));

server.use(express.static(path.join(__dirname, 'public')));
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

let registration_count;


const configPath = path.resolve(__dirname, 'config.json');

const updateConfig = (key, newValue) => {
    const config = getConfig();
    config[key] = newValue;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
    console.log(`${key} güncellendi: ${newValue}`);
};

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB bağlantısı başarılı!'))
    .catch((err) => console.error('MongoDB bağlantı hatası:', err));

const StudentSchema = new mongoose.Schema({
    name: String,
    tc: String,
    birthdate: Date,
    group: String,
    father_name: String,
    father_phone: String,
    mother_name: String,
    mother_phone: String,
    school: String,
    adress: String,
    registration_date: Date,
    membership: String,
});
    
const Student = mongoose.model('Student', StudentSchema);

const paymentSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    amount: Number,
    payment_date: Object,
    date_paid: Date,
});
    
const Payment = mongoose.model('Payment', paymentSchema);

const unpaid_paymentSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    payment_date: Object,
});
    
const UnpaidPayment = mongoose.model('Unpaid_payment', unpaid_paymentSchema);

const monthsSchema = new mongoose.Schema({
    month: Number,
    year: Number,
});
    
const Months = mongoose.model('Month', monthsSchema);

function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next(); // Kullanıcı doğrulandı, devam et
    } else {
        res.redirect('/'); // Giriş yapmamış, login sayfasına yönlendir
    }
}

server.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.get('/search-student', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search-student.html'));
});

server.get('/students/:name', isAuthenticated, async (req, res) => {
    const student_name = req.params.name;
    const formatted_name = student_name.replace(/\-/g, ' ');
    try {
        const student = await Student.findOne({ name: formatted_name });
        if(student) res.status(200).render('student-info', {student});
        else res.sendFile(path.join(__dirname, 'public', 'student-not-found.html'));
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Kullanıcıları getirirken bir hata oluştu.' });
    }
});

server.get('/new-registrations', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'new-registrations.html'));
});

server.get('/show-payments', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'show-payments.html'));
});

server.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const hash = crypto.createHash('sha1').update(password).digest('hex');

    if ((username === process.env.ADMIN_USERNAME && hash === process.env.ADMIN_PASSWORD) || (username === process.env.GUEST_USERNAME && hash === process.env.GUEST_PASSWORD)) {
        req.session.isAuthenticated = true;
        req.session.username = username; // Gerekirse kullanıcının adını kaydedin
        res.redirect('/search-student');
    } else {
        res.status(401).send('Kullanıcı adı veya şifre hatalı!');
    }
});

server.get('/logout', (req, res) => {
    // Session'u yok et
    req.session.destroy((err) => {
      if (err) {
        console.error('Session sonlandırılamadı:', err);
        return res.status(500).send('Çıkış sırasında bir hata oluştu.');
      }
      // Kullanıcıyı login sayfasına yönlendir
      res.redirect('/');
    });
  });
  

server.post('/api/check-month', async (req, res) => {
    const { month, year } = req.body;

    const Month = await Months.findOne({ month: month, year: year });
    if (Month) {
        res.status(200).json('EXISTS');
    } else {
        res.status(200).json('NOT EXISTS');
    }
});

server.post('/api/add-unpaid-payments', async (req, res) => {
    try {
        const { owner, payment_date } = req.body;

        // Yeni öğrenci oluştur
        const newUnpaidPayment = new UnpaidPayment({ owner, payment_date });
        await newUnpaidPayment.save();

        res.status(200).json('OK');
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu', error });
    }
});

server.post('/api/add-month', async (req, res) => {
    try {
        const { month, year } = req.body;

        // Yeni öğrenci oluştur
        const newMonth = new Months({ month, year });
        await newMonth.save();

        res.status(200).json('OK');
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu', error });
    }
});

server.get('/api/unpaid-payments', async (req, res) => {
    try {
        const payments = await UnpaidPayment.find().populate('owner', 'name').limit(7).sort({ _id: 1 });
        res.status(200).json(payments);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Ödemeleri getirirken bir hata oluştu.' });
    }
});

server.get('/api/unpaid-payments/:id', async (req, res) => {
    const owner = req.params.id;
    
    try {
        const payments = await UnpaidPayment.find({owner: owner}).populate('owner', 'name').sort({ _id: 1 });
        res.status(200).json(payments);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Ödemeleri getirirken bir hata oluştu.' });
    }
});

server.post('/api/delete-unpaid-payment', async (req, res) => {
    const { _id, owner, amount, payment_date, date_paid } = req.body;
    
    try {
        const result = await UnpaidPayment.deleteOne({ _id: _id });
        if(result.deletedCount === 1){
            try {
                const newPayment = new Payment({ owner: owner, amount: amount, payment_date: payment_date, date_paid: date_paid});
                await newPayment.save();
        
                res.status(200).json('OK');
            } catch (error) {
                console.error('Hata:', error);
                res.status(500).json({ message: 'Bir hata oluştu', error });
            }
        }
        else res.status(400).json('error');
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Verileri getirirken bir hata oluştu.' });
    }
});

server.post('/api/add-unpaid-payment', async (req, res) => {
    const { _id, owner, amount, payment_date } = req.body;
    
    try {
        const result = await Payment.deleteOne({ _id: _id });
        if(result.deletedCount === 1){
            try {
                const newUnpaidPayment = new UnpaidPayment({ owner: owner, amount: amount, payment_date: payment_date});
                await newUnpaidPayment.save();
        
                res.status(200).json('OK');
            } catch (error) {
                console.error('Hata:', error);
                res.status(500).json({ message: 'Bir hata oluştu', error });
            }
        }
        else res.status(400).json('error');
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Verileri getirirken bir hata oluştu.' });
    }
});

server.post('/api/find-unpaid-payments', async (req, res) => {
    const { owner } = req.body;
    try {
        const unpaidPayments = await UnpaidPayment.find({owner: owner}).sort({ _id: -1 });
        res.status(200).json(unpaidPayments);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Ödemeleri getirirken bir hata oluştu.' });
    }
});

server.post('/api/delete-student-payments', async (req, res) => {
    const { _id } = req.body;
    
    try {
        const result = await Payment.deleteMany({ owner: _id });
        res.status(200).json('OK');
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Verileri getirirken bir hata oluştu.' });
    }
});

server.post('/api/new-student', async (req, res) => {
    try {
        const { name, tc, birthdate, registration_date, group, school, father_name, father_phone, mother_name, mother_phone, adress, membership } = req.body;

        // Yeni öğrenci oluştur
        const newStudent = new Student({ name, tc, birthdate, registration_date, group, school, father_name, father_phone, mother_name, mother_phone, adress, membership });
        await newStudent.save();

        res.status(200).json('OK');
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu', error });
    }
});

server.post('/api/update-student', async (req, res) => {
    try {
        const { id, name, tc, birthdate, registration_date, group, school, father_name, father_phone, mother_name, mother_phone, adress, membership } = req.body;

        // Yeni öğrenci oluştur
        const updatedStudent = await Student.findByIdAndUpdate(
            id, // Güncellenecek öğrencinin ID'si
            { 
                name, 
                tc, 
                birthdate, 
                registration_date, 
                group, 
                school, 
                father_name, 
                father_phone, 
                mother_name, 
                mother_phone, 
                adress, 
                membership 
            },
            { new: true, runValidators: true } // Güncellenmiş belgeyi döndür ve doğrulama çalıştır
        );

        res.status(200).json('OK');
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu', error });
    }
});

server.post('/api/delete-student', async (req, res) => {
    const { _id } = req.body;
    
    try {
        const result = await Student.deleteOne({ _id: _id });
        if(result.deletedCount === 1){
            res.status(200).json('OK');
        }
        else res.status(400).json('error');
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Verileri getirirken bir hata oluştu.' });
    }
});

server.get('/api/students-list', async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Kullanıcıları getirirken bir hata oluştu.' });
    }
});

server.post('/api/search-student', async (req, res) => {
    const { name } = req.body;
    try {
        const students = await Student.find({ name: { $regex: name, $options: 'i' } });
        res.status(200).json(students);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Kullanıcıları getirirken bir hata oluştu.' });
    }
});

server.get('/api/payments-list', async (req, res) => {
    try {
        const payments = await Payment.find().populate('owner', 'name').limit(7).sort({ _id: -1 });
        res.status(200).json(payments);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Ödemeleri getirirken bir hata oluştu.' });
    }
});

server.post('/api/find-payments', async (req, res) => {
    const { owner } = req.body;
    try {
        const payments = await Payment.find({owner: owner}).sort({ _id: -1 });
        res.status(200).json(payments);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Ödemeleri getirirken bir hata oluştu.' });
    }
});

server.post('/api/update-payment', async (req, res) => {
    try {
        const { id, amount, date_paid } = req.body;

        // Yeni öğrenci oluştur
        const updatedPayment = await Payment.findByIdAndUpdate(
            id, // Güncellenecek öğrencinin ID'si
            { 
                amount,
                date_paid
            },
            { new: true, runValidators: true } // Güncellenmiş belgeyi döndür ve doğrulama çalıştır
        );

        res.status(200).json('OK');
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ message: 'Bir hata oluştu', error });
    }
});

server.get('/api/payments-list/:id', async (req, res) => {
    const owner = req.params.id;
    try {
        const payments = await Payment.find({owner: owner}).populate('owner', 'name').sort({ _id: -1 });
        res.status(200).json(payments);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Ödemeleri getirirken bir hata oluştu.' });
    }
});

server.get('/api/last-payments', async (req, res) => {
    try {
        const payments = await Payment.find().populate('owner', 'name').sort({ _id: -1 }).limit(3);
        res.status(200).json(payments);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Ödemeleri getirirken bir hata oluştu.' });
    }
});

server.get('/api/config', async (req, res) => {
    try {
        // Dosyayı oku ve JSON olarak parse et
        const rawData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(rawData);

        config.forEach(element => {
            if(element.validity === 'valid') res.status(200).json(config);
        });
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Config dosyasında bir hata oluştu.' });
    }
});

server.get('/api/last-registered-students', async (req, res) => {
    try {
        const students = await Student.find().sort({ _id: -1 }).limit(2);
        res.status(200).json(students);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Kullanıcıları getirirken bir hata oluştu.' });
    }
});

server.get('/api/form-student-registrations', async (req, res) => {
    try {
        // Google Sheets API'ye istek gönder
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/A2:N100?key=${process.env.SHEETS_API_KEY}`);
        
        // Yanıtı JSON formatında al
        const data = await response.json();

        // Eğer veri varsa, veriyi gönder
        if (data.values) {
            res.status(200).json(data.values); // Veriyi döndür
            
        } else {
            res.status(404).json({ error: 'Veri bulunamadı.' });
        }
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Kullanıcıları getirirken bir hata oluştu.' });
    }
});

server.get('/api/form-student-registrations-count', async (req, res) => {
    res.status(200).json(registration_count);
});

async function get_registration_count() {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/A2:N100?key=${process.env.SHEETS_API_KEY}`);
        const data = await response.json();
    
        if (data.values) {
            registration_count = data.values.length;
        } else {
            registration_count = 0;
        }
        console.log('Registration Count: ' + registration_count);
        
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Kullanıcıları getirirken bir hata oluştu.' });
    }
}

server.get('/api/form-student-delete/:name', async (req, res) => {
    const student_name = req.params.name;
    const formatted_name = student_name.replace(/\-/g, ' ');
    try {
        // Google Sheets'ten verileri çek
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/A2:N100?key=${process.env.SHEETS_API_KEY}`);
        const data = await response.json();

        if (data.values) {
            // Silmek istediğiniz değeri kontrol edin
            let rowIndexToDelete = null;

            for (let i = 0; i < data.values.length; i++) {
                const row = data.values[i];
                if (row[1] === formatted_name) { // 0. sütun (A sütunu) kontrol ediliyor
                    rowIndexToDelete = i + 2; // Satır numarası (A2 -> index 0 + 2)
                    break;
                }
            }

            if (rowIndexToDelete) {
                // Satırı sil
                await deleteRow(rowIndexToDelete);
                res.status(200).json('OK');
            } else {
                res.status(404).json({ error: 'Silinecek değer bulunamadı.' });
            }
        } else {
            res.status(404).json({ error: 'Veri bulunamadı.' });
        }
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ error: 'Kullanıcıları getirirken bir hata oluştu.' });
    }
});

async function deleteRow(rowIndex) {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}:batchUpdate?key=${process.env.SHEETS_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: 0, // İlk sayfa için genellikle 0
                                dimension: 'ROWS',
                                startIndex: rowIndex - 1, // Başlangıç indeksi (0 tabanlı)
                                endIndex: rowIndex, // Bitiş indeksi (satır dahil değil)
                            },
                        },
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`Satır silme başarısız: ${response.statusText}`);
        }

        console.log(`Satır ${rowIndex} başarıyla silindi.`);
    } catch (error) {
        console.error('Satır silme hatası:', error);
    }
}

server.listen(PORT, () => {
    get_registration_count();
});