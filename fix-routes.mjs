import fs from 'fs';
let code = fs.readFileSync('backend/src/routes/domain.ts', 'utf8');

// Fix renewal-price
code = code.replace(
  /} catch \(error: any\) {\s+console.error\('Domain renewal price error:', error\);\s+}/g,
  } catch (error: any) {\n    console.error('Domain renewal price error:', error);\n    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });\n  }
);

// Fix renewal-price-breakdown
code = code.replace(
  /} catch \(error: any\) {\s+console.error\('Domain renewal price breakdown error:', error\);\s+}/g,
  } catch (error: any) {\n    console.error('Domain renewal price breakdown error:', error);\n    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });\n  }
);

fs.writeFileSync('backend/src/routes/domain.ts', code);
console.log('Fixed catch blocks');
